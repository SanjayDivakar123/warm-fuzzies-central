import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Users, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

interface GoogleUser {
  id: string;
  primaryEmail: string;
  name: {
    fullName: string;
    givenName?: string;
    familyName?: string;
  };
  orgUnitPath?: string;
  isAdmin?: boolean;
  suspended?: boolean;
}

interface GoogleWorkspaceImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyDomain?: string;
  existingEmails: string[];
  onImportComplete: () => void;
  mode?: 'import' | 'sync';
}

export default function GoogleWorkspaceImportModal({
  open,
  onOpenChange,
  companyId,
  companyDomain,
  existingEmails,
  onImportComplete,
  mode = 'import',
}: GoogleWorkspaceImportModalProps) {
  const [step, setStep] = useState<'auth' | 'loading' | 'select' | 'importing' | 'syncing'>('auth');
  const [users, setUsers] = useState<GoogleUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importResults, setImportResults] = useState<{ success: number; failed: number } | null>(null);
  const [syncResults, setSyncResults] = useState<{ synced: number; updated: number } | null>(null);
  const { toast } = useToast();

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep('auth');
      setUsers([]);
      setSelectedUsers(new Set());
      setSearchQuery("");
      setError(null);
      setImportResults(null);
      setSyncResults(null);
    }
  }, [open]);

  const handleGoogleAuth = async () => {
    setStep('loading');
    setError(null);

    try {
      // Request OAuth with admin directory scope
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href,
          scopes: 'https://www.googleapis.com/auth/admin.directory.user.readonly',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            hd: companyDomain || undefined,
          },
        },
      });

      if (authError) throw authError;
      
      // The page will redirect to Google, and when it comes back we'll detect it
    } catch (err: any) {
      setError(err.message || "Failed to authenticate with Google");
      setStep('auth');
    }
  };

  const fetchGoogleUsers = async () => {
    setStep('loading');
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const providerToken = sessionData?.session?.provider_token;

      if (!providerToken) {
        throw new Error("No Google access token available. Please re-authenticate.");
      }

      // If sync mode, trigger the sync function instead
      if (mode === 'sync') {
        const { data, error } = await supabase.functions.invoke('sync-google-workspace-users', {
          body: {
            companyId,
            accessToken: providerToken,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        setSyncResults({ synced: data.synced || 0, updated: data.updated || 0 });
        setStep('syncing');
        
        toast({
          title: "Sync complete",
          description: `Synced ${data.synced} users, updated ${data.updated} records`,
        });
        onImportComplete();
        return;
      }

      const { data, error } = await supabase.functions.invoke('fetch-google-workspace-users', {
        body: {
          accessToken: providerToken,
          domain: companyDomain,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Filter out suspended users and already existing users
      const activeUsers = (data.users || []).filter((user: GoogleUser) => 
        !user.suspended && !existingEmails.includes(user.primaryEmail.toLowerCase())
      );

      setUsers(activeUsers);
      setStep('select');
    } catch (err: any) {
      console.error('Error fetching Google users:', err);
      setError(err.message || "Failed to fetch users from Google Workspace");
      setStep('auth');
    }
  };

  // Check if we have a provider token on mount (returned from OAuth)
  useEffect(() => {
    if (open && step === 'auth') {
      const checkSession = async () => {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.provider_token) {
          // We have a token, try to fetch users
          fetchGoogleUsers();
        }
      };
      checkSession();
    }
  }, [open, step]);

  const toggleUser = (email: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(email)) {
      newSelected.delete(email);
    } else {
      newSelected.add(email);
    }
    setSelectedUsers(newSelected);
  };

  const toggleAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.primaryEmail)));
    }
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.primaryEmail.toLowerCase().includes(query) ||
      user.name.fullName.toLowerCase().includes(query)
    );
  });

  const handleImport = async () => {
    if (selectedUsers.size === 0) return;

    setStep('importing');
    let success = 0;
    let failed = 0;

    for (const email of selectedUsers) {
      const user = users.find(u => u.primaryEmail === email);
      if (!user) continue;

      try {
        const { data, error } = await supabase.functions.invoke('invite-company-user', {
          body: {
            company_id: companyId,
            email: user.primaryEmail,
            full_name: user.name.fullName,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        success++;
      } catch (err) {
        console.error(`Failed to invite ${email}:`, err);
        failed++;
      }
    }

    setImportResults({ success, failed });
    
    if (success > 0) {
      toast({
        title: "Import complete",
        description: `Successfully invited ${success} user${success !== 1 ? 's' : ''}${failed > 0 ? `, ${failed} failed` : ''}`,
      });
      onImportComplete();
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'auth':
        return (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">Connect to Google Workspace</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Sign in with your Google Workspace admin account to import users from your organization directory.
              </p>
            </div>
            {error && (
              <Alert variant="destructive" className="max-w-sm">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button onClick={handleGoogleAuth} className="gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google Admin
            </Button>
            <p className="text-xs text-muted-foreground text-center max-w-sm">
              Requires a Google Workspace admin account with Directory API access. 
              {companyDomain && ` Users will be imported from @${companyDomain}.`}
            </p>
          </div>
        );

      case 'loading':
        return (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Fetching users from Google Workspace...</p>
          </div>
        );

      case 'select':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="sm" onClick={toggleAll}>
                {selectedUsers.size === filteredUsers.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            {users.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No new users found to import. All users may already be invited or there are no users in your organization.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <ScrollArea className="h-[350px] border rounded-lg">
                  <div className="divide-y">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleUser(user.primaryEmail)}
                      >
                        <Checkbox
                          checked={selectedUsers.has(user.primaryEmail)}
                          onCheckedChange={() => toggleUser(user.primaryEmail)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{user.name.fullName}</p>
                          <p className="text-sm text-muted-foreground truncate">{user.primaryEmail}</p>
                        </div>
                        {user.isAdmin && (
                          <Badge variant="secondary" className="shrink-0">Admin</Badge>
                        )}
                        {user.orgUnitPath && user.orgUnitPath !== '/' && (
                          <Badge variant="outline" className="shrink-0 text-xs">
                            {user.orgUnitPath.split('/').pop()}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-muted-foreground">
                    {selectedUsers.size} of {filteredUsers.length} users selected
                  </p>
                  <Button 
                    onClick={handleImport} 
                    disabled={selectedUsers.size === 0}
                  >
                    Import {selectedUsers.size} User{selectedUsers.size !== 1 ? 's' : ''}
                  </Button>
                </div>
              </>
            )}
          </div>
        );

      case 'importing':
        return (
          <div className="flex flex-col items-center gap-4 py-8">
            {importResults ? (
              <>
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg">Import Complete</h3>
                  <div className="flex items-center justify-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                      {importResults.success} invited
                    </span>
                    {importResults.failed > 0 && (
                      <span className="flex items-center gap-1 text-destructive">
                        <XCircle className="h-4 w-4" />
                        {importResults.failed} failed
                      </span>
                    )}
                  </div>
                </div>
                <Button onClick={() => onOpenChange(false)}>Done</Button>
              </>
            ) : (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Inviting {selectedUsers.size} users...
                </p>
              </>
            )}
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Import from Google Workspace
          </DialogTitle>
          <DialogDescription>
            Import users directly from your Google Workspace admin console
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
