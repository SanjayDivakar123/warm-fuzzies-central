import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Key, Plus, Trash2, Copy, Check, RefreshCw, Calendar, Book, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { logAuditEvent, AUDIT_ACTIONS, AUDIT_ENTITIES } from '@/lib/auditLogger';
import ApiDocumentation from './ApiDocumentation';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  permissions: string[];
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

interface ApiKeyManagementProps {
  companyId: string;
}

export default function ApiKeyManagement({ companyId }: ApiKeyManagementProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{ name: string; fullKey: string } | null>(null);
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState({
    read: true,
    write: false,
    delete: false,
  });
  const [newKeyExpiry, setNewKeyExpiry] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchApiKeys();
  }, [companyId]);

  const fetchApiKeys = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('company_api_keys')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching API keys:', error);
    } else {
      setApiKeys(data?.map(k => ({
        ...k,
        permissions: k.permissions as string[] || ['read']
      })) || []);
    }
    setLoading(false);
  };

  const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'rcf_';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  };

  const hashKey = async (key: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for the API key.',
        variant: 'destructive',
      });
      return;
    }
    const selectedPermissions = Object.entries(newKeyPermissions)
      .filter(([_, enabled]) => enabled)
      .map(([perm]) => perm);
    if (selectedPermissions.length === 0) {
      toast({
        title: 'Permissions required',
        description: 'Select at least one permission for the API key.',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      const fullKey = generateApiKey();
      const keyHash = await hashKey(fullKey);
      const keyPrefix = fullKey.substring(0, 8);
      const permissions = selectedPermissions;

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('company_api_keys')
        .insert({
          company_id: companyId,
          name: newKeyName,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          permissions,
          created_by: user?.id,
          expires_at: newKeyExpiry ? new Date(newKeyExpiry).toISOString() : null,
        });

      if (error) throw error;

      setNewKeyData({ name: newKeyName, fullKey });
      setShowCreateModal(false);
      setShowNewKeyModal(true);
      setNewKeyName('');
      setNewKeyPermissions({ read: true, write: false, delete: false });
      setNewKeyExpiry('');
      fetchApiKeys();

      toast({
        title: 'API key created',
        description: 'Make sure to copy your key now - you won\'t be able to see it again.',
      });

      await logAuditEvent({
        companyId,
        action: AUDIT_ACTIONS.API_KEY_CREATED,
        entityType: AUDIT_ENTITIES.API_KEY,
        details: { name: newKeyName, key_prefix: keyPrefix, permissions, expires_at: newKeyExpiry || null },
      });
    } catch (error: any) {
      toast({
        title: 'Error creating API key',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!deleteKeyId) return;

    try {
      const { data, error } = await supabase
        .from('company_api_keys')
        .select('key_prefix,name')
        .eq('id', deleteKeyId)
        .single();
      if (error) throw error;

      const { error: delError } = await supabase
        .from('company_api_keys')
        .delete()
        .eq('id', deleteKeyId);
      if (delError) throw delError;

      toast({
        title: 'API key deleted',
        description: 'The API key has been permanently removed.',
      });
      fetchApiKeys();

      await logAuditEvent({
        companyId,
        action: AUDIT_ACTIONS.API_KEY_REVOKED,
        entityType: AUDIT_ENTITIES.API_KEY,
        details: { id: deleteKeyId, key_prefix: data?.key_prefix, name: data?.name },
      });
    } catch (error: any) {
      toast({
        title: 'Error deleting API key',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleteKeyId(null);
    }
  };

  const handleToggleKey = async (keyId: string, isActive: boolean) => {
    try {
      const { data, error } = await supabase
        .from('company_api_keys')
        .update({ is_active: isActive })
        .eq('id', keyId)
        .select('key_prefix,name')
        .single();

      if (error) throw error;

      setApiKeys(apiKeys.map(k => k.id === keyId ? { ...k, is_active: isActive } : k));
      toast({
        title: isActive ? 'API key activated' : 'API key deactivated',
      });

      await logAuditEvent({
        companyId,
        action: AUDIT_ACTIONS.SETTINGS_UPDATED,
        entityType: AUDIT_ENTITIES.API_KEY,
        details: { id: keyId, key_prefix: data?.key_prefix, name: data?.name, is_active: isActive },
      });
    } catch (error: any) {
      toast({
        title: 'Error updating API key',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCopyKey = async () => {
    if (newKeyData) {
      await navigator.clipboard.writeText(newKeyData.fullKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Show documentation or key management */}
      {showDocs ? (
        <div className="space-y-4">
          <Button 
            variant="ghost" 
            onClick={() => setShowDocs(false)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to API Keys
          </Button>
          <ApiDocumentation companyId={companyId} />
        </div>
      ) : (
        <>
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    API Keys
                  </CardTitle>
                  <CardDescription>
                    Manage API keys for programmatic access to your company data
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setShowDocs(true)} size="sm">
                    <Book className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">View </span>Docs
                  </Button>
                  <Button onClick={() => setShowCreateModal(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Key
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No API keys created yet</p>
                  <p className="text-sm">Create a key to integrate with external systems</p>
                  <Button 
                    variant="link" 
                    onClick={() => setShowDocs(true)}
                    className="mt-2"
                  >
                    <Book className="h-4 w-4 mr-2" />
                    Read the API documentation
                  </Button>
                </div>
              ) : (
                <Table className="min-w-[500px] sm:min-w-0">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Key</TableHead>
                      <TableHead className="hidden md:table-cell">Permissions</TableHead>
                      <TableHead className="hidden lg:table-cell">Last Used</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {key.key_prefix}...
                      </code>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex gap-1 flex-wrap">
                        {key.permissions.map((perm) => (
                          <Badge key={perm} variant="secondary" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                      {key.last_used_at 
                        ? format(new Date(key.last_used_at), 'MMM d, yyyy')
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={key.is_active}
                        onCheckedChange={(checked) => handleToggleKey(key.id, checked)}
                      />
                      {key.expires_at && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Expires {format(new Date(key.expires_at), 'MMM d, yyyy')}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteKeyId(key.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </>
      )}

      {/* Create Key Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Generate a new API key for programmatic access
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="keyName">Key Name</Label>
              <Input
                id="keyName"
                placeholder="e.g., Production Integration"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newKeyPermissions.read}
                    onCheckedChange={(checked) => 
                      setNewKeyPermissions({ ...newKeyPermissions, read: checked })
                    }
                  />
                  <Label className="font-normal">Read - View team data and assessments</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newKeyPermissions.write}
                    onCheckedChange={(checked) => 
                      setNewKeyPermissions({ ...newKeyPermissions, write: checked })
                    }
                  />
                  <Label className="font-normal">Write - Create invites and update users</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newKeyPermissions.delete}
                    onCheckedChange={(checked) => 
                      setNewKeyPermissions({ ...newKeyPermissions, delete: checked })
                    }
                  />
                  <Label className="font-normal">Delete - Remove users and data</Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2" htmlFor="keyExpiry">
                <Calendar className="h-4 w-4" />
                Expiration (optional)
              </Label>
              <Input
                id="keyExpiry"
                type="date"
                value={newKeyExpiry}
                onChange={(e) => setNewKeyExpiry(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Expired keys cannot be used; leave blank for no expiry.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateKey} disabled={creating}>
              {creating ? 'Creating...' : 'Create Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show New Key Modal */}
      <Dialog open={showNewKeyModal} onOpenChange={setShowNewKeyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Copy your API key now. You won't be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Your API Key</Label>
            <div className="mt-2 flex gap-2">
              <code className="flex-1 p-3 bg-muted rounded text-sm font-mono break-all">
                {newKeyData?.fullKey}
              </code>
              <Button variant="outline" size="icon" onClick={handleCopyKey}>
                {copiedKey ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Store this key securely. It provides access to your company data.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => {
              setShowNewKeyModal(false);
              setNewKeyData(null);
            }}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteKeyId} onOpenChange={() => setDeleteKeyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Any integrations using this key will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteKey} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
