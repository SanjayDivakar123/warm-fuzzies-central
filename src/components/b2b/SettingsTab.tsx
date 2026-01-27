import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Upload,
  Eye,
  CheckCircle2,
  CreditCard,
  X,
  Trash2,
  Wallet,
  Sun,
  Moon,
  Plus,
  Globe,
  Copy,
  ExternalLink,
  Link2,
  AlertTriangle,
} from "lucide-react";
import DeleteCompanyModal from "./DeleteCompanyModal";
import PaymentMethodCard from "./PaymentMethodCard";
import ThemeExportImport from "./ThemeExportImport";
import AddCreditsModal from "./AddCreditsModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SettingsTabProps {
  company: any;
  onSettingsSaved?: () => void;
  scrollToSection?: string | null;
  onScrollComplete?: () => void;
}

export default function SettingsTab({ company, onSettingsSaved, scrollToSection, onScrollComplete }: SettingsTabProps) {
  const [logoUrl, setLogoUrl] = useState(company.logo_url || "");
  const [logoUrlDark, setLogoUrlDark] = useState(company.logo_url_dark || "");
  const [primaryColor, setPrimaryColor] = useState(company.primary_color);
  const [secondaryColor, setSecondaryColor] = useState(company.secondary_color);
  const [subdomain, setSubdomain] = useState(company.subdomain);
  const [subdomainEnabled, setSubdomainEnabled] = useState(company.subdomain_enabled || false);
  const [customDomain, setCustomDomain] = useState(company.custom_domain || "");
  const [customDomainEnabled, setCustomDomainEnabled] = useState(company.custom_domain_enabled);
  const [googleSsoEnabled, setGoogleSsoEnabled] = useState(company.google_sso_enabled || false);
  const [googleWorkspaceDomain, setGoogleWorkspaceDomain] = useState(company.google_workspace_domain || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"light" | "dark" | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addCreditsOpen, setAddCreditsOpen] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [disableSubdomainConfirmOpen, setDisableSubdomainConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputDarkRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch credit balance from company record
  useEffect(() => {
    // Use the credit_balance from the company prop directly
    setCreditBalance(company.credit_balance || 0);
    setLoadingBalance(false);
  }, [company.id, company.credit_balance]);

  // Handle scroll to section
  useEffect(() => {
    if (scrollToSection) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const element = document.getElementById(scrollToSection);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Add a highlight effect
          element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
          }, 2000);
        }
        onScrollComplete?.();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [scrollToSection, onScrollComplete]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, mode: "light" | "dark") => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(mode);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${company.id}/logo-${mode}-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage.from("company-logos").upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from("company-logos").getPublicUrl(fileName);

      const newLogoUrl = urlData.publicUrl;

      if (mode === "light") {
        setLogoUrl(newLogoUrl);
        await supabase.from("companies").update({ logo_url: newLogoUrl }).eq("id", company.id);
      } else {
        setLogoUrlDark(newLogoUrl);
        await supabase.from("companies").update({ logo_url_dark: newLogoUrl }).eq("id", company.id);
      }

      toast({
        title: "Logo uploaded",
        description: `Your ${mode} mode logo has been updated`,
      });

      if (onSettingsSaved) {
        onSettingsSaved();
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
      // Reset file inputs
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (fileInputDarkRef.current) fileInputDarkRef.current.value = "";
    }
  };

  const handleRemoveLogo = async (mode: "light" | "dark") => {
    if (mode === "light") {
      setLogoUrl("");
      await supabase.from("companies").update({ logo_url: "" }).eq("id", company.id);
    } else {
      setLogoUrlDark("");
      await supabase.from("companies").update({ logo_url_dark: "" }).eq("id", company.id);
    }

    if (onSettingsSaved) {
      onSettingsSaved();
      toast({
        title: "Logo removed",
        description: `Your ${mode} mode logo has been removed`,
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({
          logo_url: logoUrl,
          logo_url_dark: logoUrlDark,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          subdomain,
          subdomain_enabled: subdomainEnabled,
          custom_domain: customDomain,
          custom_domain_enabled: customDomainEnabled,
          google_sso_enabled: googleSsoEnabled,
          google_workspace_domain: googleWorkspaceDomain || null,
        })
        .eq("id", company.id);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your company settings have been updated.",
      });

      // Refresh company data in parent
      if (onSettingsSaved) {
        onSettingsSaved();
      }
    } catch (error: any) {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium">Branding</CardTitle>
          <CardDescription>Customize your company portal appearance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Light Mode Logo */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              Light Mode Logo
            </Label>

            {logoUrl && (
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-background">
                <img src={logoUrl} alt="Light mode logo" className="h-12 w-auto max-w-[180px] object-contain" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveLogo("light")}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="Enter logo URL or upload..."
                className="flex-1"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, "light")}
                className="hidden"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading === "light"}
                title="Upload Logo"
              >
                {uploading === "light" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Dark Mode Logo */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              Dark Mode Logo
            </Label>

            {logoUrlDark && (
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-foreground/5">
                <img src={logoUrlDark} alt="Dark mode logo" className="h-12 w-auto max-w-[180px] object-contain" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveLogo("dark")}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={logoUrlDark}
                onChange={(e) => setLogoUrlDark(e.target.value)}
                placeholder="Enter dark mode logo URL or upload..."
                className="flex-1"
              />
              <input
                ref={fileInputDarkRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, "dark")}
                className="hidden"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputDarkRef.current?.click()}
                disabled={uploading === "dark"}
                title="Upload Logo"
              >
                {uploading === "dark" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Click the upload icon to add your logo. Recommended aspect ratio: 4:1 (200×50px).
            </p>
          </div>

          {/* Logo Preview Section */}
          {(logoUrl || logoUrlDark) && (
            <div className="space-y-3 pt-2">
              <Label className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Logo Preview
              </Label>
              <div className="grid grid-cols-2 gap-4">
                {/* Light Mode Preview */}
                <div className="rounded-lg border overflow-hidden">
                  <div
                    className="px-4 py-6 flex items-center justify-center min-h-[80px]"
                    style={{ backgroundColor: "#ffffff" }}
                  >
                    {logoUrl ? (
                      <img src={logoUrl} alt="Light mode preview" className="h-10 w-auto max-w-full object-contain" />
                    ) : logoUrlDark ? (
                      <img
                        src={logoUrlDark}
                        alt="Fallback to dark logo"
                        className="h-10 w-auto max-w-full object-contain opacity-50"
                      />
                    ) : (
                      <span className="text-muted-foreground text-sm">No logo</span>
                    )}
                  </div>
                  <div
                    className="px-3 py-1.5 flex items-center justify-center gap-1.5 border-t"
                    style={{ backgroundColor: "#f3f4f6" }}
                  >
                    <Sun className="h-3.5 w-3.5" style={{ color: "#6b7280" }} />
                    <span className="text-xs font-medium" style={{ color: "#4b5563" }}>
                      Light Mode
                    </span>
                  </div>
                </div>

                {/* Dark Mode Preview */}
                <div className="rounded-lg border overflow-hidden">
                  <div
                    className="px-4 py-6 flex items-center justify-center min-h-[80px]"
                    style={{ backgroundColor: "#111827" }}
                  >
                    {logoUrlDark ? (
                      <img
                        src={logoUrlDark}
                        alt="Dark mode preview"
                        className="h-10 w-auto max-w-full object-contain"
                      />
                    ) : logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Fallback to light logo"
                        className="h-10 w-auto max-w-full object-contain opacity-50"
                      />
                    ) : (
                      <span className="text-muted-foreground text-sm">No logo</span>
                    )}
                  </div>
                  <div
                    className="px-3 py-1.5 flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: "#1f2937", borderTop: "1px solid #374151" }}
                  >
                    <Moon className="h-3.5 w-3.5" style={{ color: "#9ca3af" }} />
                    <span className="text-xs font-medium" style={{ color: "#d1d5db" }}>
                      Dark Mode
                    </span>
                  </div>
                </div>
              </div>
              {!logoUrlDark && logoUrl && (
                <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 p-2 rounded">
                  💡 No dark mode logo uploaded. Your light mode logo will be used as a fallback.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <Input
                id="primaryColor"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <Input
                id="secondaryColor"
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Export/Import */}
      <ThemeExportImport
        company={company}
        logoUrl={logoUrl}
        logoUrlDark={logoUrlDark}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        onImport={(settings) => {
          setLogoUrl(settings.logoUrl);
          setLogoUrlDark(settings.logoUrlDark);
          setPrimaryColor(settings.primaryColor);
          setSecondaryColor(settings.secondaryColor);
        }}
        onSettingsSaved={onSettingsSaved}
      />

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <Globe className="h-5 w-5" />
            Portal Settings
          </CardTitle>
          <CardDescription>Configure your company portal URLs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Path-based URL (always available) */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Path-Based URL
            </Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 p-3 bg-muted rounded-lg">
                <code className="text-sm font-mono flex-1 truncate">
                  https://rolecolorfinder.com/company/{subdomain}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(`https://rolecolorfinder.com/company/${subdomain}`);
                    toast({ title: "URL copied to clipboard" });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => window.open(`/company/${subdomain}`, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">This URL is always available for your employees</p>
          </div>

          {/* Company Identifier */}
          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="subdomain">Company Identifier</Label>
            <div className="flex items-center gap-2">
              <Input
                id="subdomain"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="max-w-[200px]"
                placeholder="your-company"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and hyphens only (3-63 characters)
            </p>
          </div>

          {/* Subdomain URL */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Custom Subdomain URL
                {subdomainEnabled && (
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  >
                    Active
                  </Badge>
                )}
              </Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="subdomainEnabled"
                  checked={subdomainEnabled}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSubdomainEnabled(true);
                      toast({
                        title: "Subdomain enabled",
                        description: `Your custom URL is now active at ${subdomain}.rolecolorfinder.com`,
                      });
                    } else {
                      // Show confirmation dialog before disabling
                      setDisableSubdomainConfirmOpen(true);
                    }
                  }}
                />
                <Label htmlFor="subdomainEnabled" className="text-sm font-normal">
                  Enable subdomain
                </Label>
              </div>
            </div>

            {subdomainEnabled && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <code className="text-sm font-mono flex-1 truncate text-primary">
                    https://{subdomain}.rolecolorfinder.com
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://${subdomain}.rolecolorfinder.com`);
                      toast({ title: "Subdomain URL copied to clipboard" });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => window.open(`https://${subdomain}.rolecolorfinder.com`, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this custom URL with your employees for easy access
                </p>
              </div>
            )}

            {!subdomainEnabled && (
              <p className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                Enable subdomain to give employees a memorable URL like <strong>{subdomain}.rolecolorfinder.com</strong>
              </p>
            )}
          </div>


          {/* Disable Subdomain Confirmation Dialog */}
          <AlertDialog open={disableSubdomainConfirmOpen} onOpenChange={setDisableSubdomainConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Disable Subdomain?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>
                    Are you sure you want to disable the custom subdomain URL?
                  </p>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg mt-2">
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      <strong>{subdomain}.rolecolorfinder.com</strong> will no longer be active. 
                      Employees using this URL will not be able to access your portal.
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    The path-based URL will remain available as a fallback.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    setSubdomainEnabled(false);
                    setDisableSubdomainConfirmOpen(false);
                    toast({
                      title: "Subdomain disabled",
                      description: "Your custom subdomain URL is no longer active.",
                    });
                  }}
                >
                  Disable Subdomain
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Google SSO Settings */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google SSO
          </CardTitle>
          <CardDescription>Allow employees and admins to sign in with their Google account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch id="googleSsoEnabled" checked={googleSsoEnabled} onCheckedChange={setGoogleSsoEnabled} />
            <Label htmlFor="googleSsoEnabled">Enable Google Sign-In</Label>
          </div>

          {googleSsoEnabled && (
            <div className="space-y-2 pt-2">
              <Label htmlFor="googleWorkspaceDomain">Google Workspace Domain (Optional)</Label>
              <Input
                id="googleWorkspaceDomain"
                value={googleWorkspaceDomain}
                onChange={(e) => setGoogleWorkspaceDomain(e.target.value.toLowerCase().trim())}
                placeholder="yourcompany.com"
              />
              <p className="text-xs text-muted-foreground">
                If set, only users with this email domain can sign in via Google (e.g., @yourcompany.com). Leave empty
                to allow any Google account that has been invited.
              </p>
            </div>
          )}

          {googleSsoEnabled !== (company.google_sso_enabled || false) && (
            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              Google SSO settings will be updated when you save.
            </p>
          )}
        </CardContent>
      </Card>



      {/* Payment Method */}
      <PaymentMethodCard company={company} />

      {/* Wallet / Credit Balance */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <Wallet className="h-5 w-5" />
            Wallet
          </CardTitle>
          <CardDescription>Your credit balance for inviting users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-primary/5 border border-primary/10">
              <span className="text-sm text-muted-foreground font-medium">Credit Balance</span>
              {loadingBalance ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <span className="font-semibold text-primary">${creditBalance.toLocaleString()}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Credits are used when inviting new users. Each invite costs $20. Credits are deducted before charging your
              card on file.
            </p>
            <Button variant="outline" className="w-full gap-2" onClick={() => setAddCreditsOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Credits
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={handleSave} 
        disabled={saving} 
        className="w-full text-white hover:opacity-90"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
      >
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save All Settings
      </Button>

      {/* Danger Zone - Delete Company */}
      <Card className="border-destructive/30 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-medium text-destructive">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Permanently delete this company and all associated data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Once you delete your company, there is no going back. All users, assessments, tasks, and settings will be
            permanently removed.
          </p>
          <Button variant="destructive" className="w-full gap-2" onClick={() => setDeleteModalOpen(true)}>
            <Trash2 className="h-4 w-4" />
            Delete Company
          </Button>
        </CardContent>
      </Card>



      {/* Delete Company Modal */}
      <DeleteCompanyModal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} company={company} />

      {/* Add Credits Modal */}
      <AddCreditsModal
        open={addCreditsOpen}
        onClose={() => setAddCreditsOpen(false)}
        companyId={company.id}
        currentBalance={creditBalance}
        onCreditsAdded={() => {
          if (onSettingsSaved) onSettingsSaved();
        }}
      />
    </div>
  );
}
