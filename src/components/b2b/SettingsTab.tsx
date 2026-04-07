import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Globe,
  Copy,
  ExternalLink,
  Link2,
  AlertTriangle,
  Bell,
  Palette,
  Key,
  Calendar,
  MessageSquare,
} from "lucide-react";
import DeleteCompanyModal from "./DeleteCompanyModal";
import PaymentMethodCard from "./PaymentMethodCard";
import ThemeExportImport from "./ThemeExportImport";
import HiringSubscriptionSettings from "./HiringSubscriptionSettings";
// Integrations infrastructure is kept, but hidden via feature flag
const INTEGRATIONS_ENABLED = true;
// Reports infrastructure is kept, but hidden via feature flag
const REPORTS_ENABLED = false;
import IntegrationsSettings from "./admin/IntegrationsSettings";
import ApiKeyManagement from "./admin/ApiKeyManagement";
import ScheduledReportsManager from "./admin/ScheduledReportsManager";

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
  companyUser?: { id: string; role: string } | null;
  onSettingsSaved?: () => void;
  scrollToSection?: string | null;
  onScrollComplete?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  registerSaveHandler?: (handler: () => Promise<boolean>) => void;
  billingOnly?: boolean;
  billingLock?: {
    outstandingBalance: number;
    reason?: string | null;
    lockedAt?: string | null;
  } | null;
  onResolveBillingLock?: (options?: { silent?: boolean }) => Promise<boolean>;
}

type SettingsSubtab = "branding" | "subscriptions" | "integrations" | "api" | "reports";

const getAvailableSettingsTabs = (): SettingsSubtab[] => [
  "branding",
  "subscriptions",
  ...(INTEGRATIONS_ENABLED ? (["integrations"] as SettingsSubtab[]) : []),
  "api",
  ...(REPORTS_ENABLED ? (["reports"] as SettingsSubtab[]) : []),
];

export default function SettingsTab({
  company,
  companyUser,
  onSettingsSaved,
  scrollToSection,
  onScrollComplete,
  onDirtyChange,
  registerSaveHandler,
  billingOnly = false,
  billingLock = null,
  onResolveBillingLock,
}: SettingsTabProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  type SaveableSettings = {
    logoUrl: string;
    logoUrlDark: string;
    primaryColor: string;
    secondaryColor: string;
    subdomain: string;
    customDomain: string;
    customDomainEnabled: boolean;
    googleSsoEnabled: boolean;
    googleWorkspaceDomain: string;
  };

  const [logoUrl, setLogoUrl] = useState(company.logo_url || "");
  const [logoUrlDark, setLogoUrlDark] = useState(company.logo_url_dark || "");
  const [primaryColor, setPrimaryColor] = useState(company.primary_color);
  const [secondaryColor, setSecondaryColor] = useState(company.secondary_color);
  const [subdomain, setSubdomain] = useState(company.subdomain);
  const [customDomain, setCustomDomain] = useState(company.custom_domain || "");
  const [customDomainEnabled, setCustomDomainEnabled] = useState(company.custom_domain_enabled);
  const [googleSsoEnabled, setGoogleSsoEnabled] = useState(company.google_sso_enabled || false);
  const [googleWorkspaceDomain, setGoogleWorkspaceDomain] = useState(company.google_workspace_domain || "");
  const [notifyTaskCompletion, setNotifyTaskCompletion] = useState(true);
  const [loadingNotifyPref, setLoadingNotifyPref] = useState(true);
  const [savingNotifyPref, setSavingNotifyPref] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"light" | "dark" | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputDarkRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const availableSettingsTabs = getAvailableSettingsTabs();
  const resolveSettingsTab = (value: string | null): SettingsSubtab =>
    availableSettingsTabs.includes(value as SettingsSubtab) ? (value as SettingsSubtab) : "branding";
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsSubtab>(() =>
    resolveSettingsTab(searchParams.get("settingsTab")),
  );
  const [lastSavedSettings, setLastSavedSettings] = useState<SaveableSettings>({
    logoUrl: company.logo_url || "",
    logoUrlDark: company.logo_url_dark || "",
    primaryColor: company.primary_color,
    secondaryColor: company.secondary_color,
    subdomain: company.subdomain,
    customDomain: company.custom_domain || "",
    customDomainEnabled: company.custom_domain_enabled,
    googleSsoEnabled: company.google_sso_enabled || false,
    googleWorkspaceDomain: company.google_workspace_domain || "",
  });

  const currentSettings: SaveableSettings = {
    logoUrl,
    logoUrlDark,
    primaryColor,
    secondaryColor,
    subdomain,
    customDomain,
    customDomainEnabled,
    googleSsoEnabled,
    googleWorkspaceDomain: googleWorkspaceDomain || "",
  };

  const hasUnsavedChanges =
    currentSettings.logoUrl !== lastSavedSettings.logoUrl ||
    currentSettings.logoUrlDark !== lastSavedSettings.logoUrlDark ||
    currentSettings.primaryColor !== lastSavedSettings.primaryColor ||
    currentSettings.secondaryColor !== lastSavedSettings.secondaryColor ||
    currentSettings.subdomain !== lastSavedSettings.subdomain ||
    currentSettings.customDomain !== lastSavedSettings.customDomain ||
    currentSettings.customDomainEnabled !== lastSavedSettings.customDomainEnabled ||
    currentSettings.googleSsoEnabled !== lastSavedSettings.googleSsoEnabled ||
    currentSettings.googleWorkspaceDomain !== lastSavedSettings.googleWorkspaceDomain;

  // Fetch credit balance from company record
  useEffect(() => {
    // Use the credit_balance from the company prop directly
    setCreditBalance(company.credit_balance || 0);
    setLoadingBalance(false);
  }, [company.id, company.credit_balance]);

  // Reset all form fields AND the saved baseline whenever the active company changes.
  // Without this, switching companies leaves stale state from the previous company,
  // causing a false dirty flag and saving the wrong subdomain to the new company.
  useEffect(() => {
    const fresh = {
      logoUrl: company.logo_url || "",
      logoUrlDark: company.logo_url_dark || "",
      primaryColor: company.primary_color,
      secondaryColor: company.secondary_color,
      subdomain: company.subdomain,
      customDomain: company.custom_domain || "",
      customDomainEnabled: company.custom_domain_enabled,
      googleSsoEnabled: company.google_sso_enabled || false,
      googleWorkspaceDomain: company.google_workspace_domain || "",
    };
    setLogoUrl(fresh.logoUrl);
    setLogoUrlDark(fresh.logoUrlDark);
    setPrimaryColor(fresh.primaryColor);
    setSecondaryColor(fresh.secondaryColor);
    setSubdomain(fresh.subdomain);
    setCustomDomain(fresh.customDomain);
    setCustomDomainEnabled(fresh.customDomainEnabled);
    setGoogleSsoEnabled(fresh.googleSsoEnabled);
    setGoogleWorkspaceDomain(fresh.googleWorkspaceDomain);
    setLastSavedSettings(fresh);
  }, [company.id]); // keyed only on id — fires exactly once per company switch

  useEffect(() => {
    onDirtyChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onDirtyChange]);

  useEffect(() => {
    const nextTab = resolveSettingsTab(searchParams.get("settingsTab"));
    setActiveSettingsTab((currentTab) => (currentTab === nextTab ? currentTab : nextTab));
  }, [searchParams]);

  // Fetch current admin's notification preference
  useEffect(() => {
    const fetchNotifyPref = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from("company_users")
        .select("notify_task_completion")
        .eq("company_id", company.id)
        .eq("user_id", user.id)
        .single();
      
      if (data) {
        setNotifyTaskCompletion(data.notify_task_completion ?? true);
      }
      setLoadingNotifyPref(false);
    };
    fetchNotifyPref();
  }, [company.id]);

  const handleNotifyPrefChange = async (checked: boolean) => {
    setSavingNotifyPref(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSavingNotifyPref(false);
      return;
    }

    const { error } = await supabase
      .from("company_users")
      .update({ notify_task_completion: checked })
      .eq("company_id", company.id)
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update notification preference",
        variant: "destructive",
      });
    } else {
      setNotifyTaskCompletion(checked);
      toast({
        title: checked ? "Notifications enabled" : "Notifications disabled",
        description: checked 
          ? "You'll receive emails when tasks are completed" 
          : "You won't receive completion emails",
      });
    }
    setSavingNotifyPref(false);
  };

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
      } else {
        setLogoUrlDark(newLogoUrl);
      }

      toast({
        title: "Logo uploaded",
        description: `Your ${mode} mode logo is ready. Click Save Settings to apply changes.`,
      });
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
    } else {
      setLogoUrlDark("");
    }
    toast({
      title: "Logo removed",
      description: `Your ${mode} mode logo removal is pending. Click Save Settings to apply changes.`,
    });
  };

  const handleSave = useCallback(async () => {
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
          custom_domain: customDomain,
          custom_domain_enabled: customDomainEnabled,
          google_sso_enabled: googleSsoEnabled,
          google_workspace_domain: googleWorkspaceDomain || null,
        })
        .eq("id", company.id);

      if (error) throw error;

      setLastSavedSettings({
        logoUrl,
        logoUrlDark,
        primaryColor,
        secondaryColor,
        subdomain,
        customDomain,
        customDomainEnabled,
        googleSsoEnabled,
        googleWorkspaceDomain: googleWorkspaceDomain || "",
      });

      toast({
        title: "Settings saved",
        description: "Your company settings have been updated.",
      });

      // Refresh company data in parent
      if (onSettingsSaved) {
        onSettingsSaved();
      }
      return true;
    } catch (error: any) {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [
    logoUrl,
    logoUrlDark,
    primaryColor,
    secondaryColor,
    subdomain,
    customDomain,
    customDomainEnabled,
    googleSsoEnabled,
    googleWorkspaceDomain,
    company.id,
    onSettingsSaved,
    toast,
  ]);

  useEffect(() => {
    if (registerSaveHandler) {
      registerSaveHandler(handleSave);
    }
  }, [registerSaveHandler, handleSave]);

  const handleSettingsTabChange = (value: string) => {
    const nextTab = resolveSettingsTab(value);
    setActiveSettingsTab(nextTab);

    const nextParams = new URLSearchParams(searchParams);
    if (nextTab === "branding") {
      nextParams.delete("settingsTab");
    } else {
      nextParams.set("settingsTab", nextTab);
    }
    setSearchParams(nextParams, { replace: true });
  };

  if (billingOnly) {
    return (
      <div className="space-y-4">
        <Card id="portal-billing-lock" className="border-amber-300 bg-amber-50/70 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-medium text-amber-900">
              <AlertTriangle className="h-5 w-5" />
              Portal Access Paused
            </CardTitle>
            <CardDescription className="text-amber-800">
              Your renewal payment did not go through. The rest of the portal is temporarily unavailable until this balance is covered.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-amber-900">
            <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-white/70 px-4 py-3">
              <span>Outstanding renewal balance</span>
              <span className="font-semibold">${Number(billingLock?.outstandingBalance || 0).toFixed(2)}</span>
            </div>
            {billingLock?.lockedAt && (
              <p className="text-xs text-amber-700">
                Access paused on {new Date(billingLock.lockedAt).toLocaleString()}.
              </p>
            )}
            <p className="text-xs text-amber-700">
              Update the card on file to settle the renewal balance. Billing credits are managed by Role Color Finder super-admins and applied automatically when available.
            </p>
          </CardContent>
        </Card>

        <PaymentMethodCard
          company={company}
          billingLock={{
            outstandingBalance: Number(billingLock?.outstandingBalance || 0),
            lockedAt: billingLock?.lockedAt || null,
          }}
          onBillingResolved={onResolveBillingLock}
        />

        {creditBalance > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-medium">
                <Wallet className="h-5 w-5" />
                Wallet
              </CardTitle>
              <CardDescription>Billing credits are managed by Role Color Finder super-admins.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <span className="text-sm text-muted-foreground font-medium">Credit Balance</span>
                  <span className="font-semibold text-primary">${creditBalance.toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Credits are automatically applied before charging your card. Contact super-admin support if you need a balance adjustment.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeSettingsTab} onValueChange={handleSettingsTabChange} className="space-y-4">
        <TabsList
          className={`grid w-full ${
            availableSettingsTabs.length >= 5
              ? "grid-cols-5"
              : availableSettingsTabs.length === 4
                ? "grid-cols-4"
                : "grid-cols-3"
          } lg:w-auto lg:inline-flex`}
        >
          <TabsTrigger value="branding" className="gap-2">
            <Palette className="h-4 w-4 hidden sm:inline" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="gap-2">
            <CreditCard className="h-4 w-4 hidden sm:inline" />
            Subscriptions
          </TabsTrigger>
          {INTEGRATIONS_ENABLED && (
            <TabsTrigger value="integrations" className="gap-2">
              <MessageSquare className="h-4 w-4 hidden sm:inline" />
              Integrations
            </TabsTrigger>
          )}
          <TabsTrigger value="api" className="gap-2">
            <Key className="h-4 w-4 hidden sm:inline" />
            API
          </TabsTrigger>
          {REPORTS_ENABLED && (
            <TabsTrigger value="reports" className="gap-2">
              <Calendar className="h-4 w-4 hidden sm:inline" />
              Reports
            </TabsTrigger>
          )}
        </TabsList>

        {hasUnsavedChanges && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in fade-in zoom-in-95 duration-300">
            <Button onClick={handleSave} disabled={saving} className="gap-2 shadow-lg border border-white/60">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </div>
        )}

        <TabsContent value="branding" className="space-y-4">
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
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Link2 className="h-4 w-4" />
              Path-Based URL
            </Label>
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <code className="text-xs sm:text-sm font-mono block break-all">
                https://rolecolorfinder.com/company/{subdomain}
              </code>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 flex-1 sm:flex-none"
                  onClick={() => {
                    navigator.clipboard.writeText(`https://rolecolorfinder.com/company/${subdomain}`);
                    toast({ title: "URL copied to clipboard" });
                  }}
                >
                  <Copy className="h-3 w-3 mr-1.5" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 flex-1 sm:flex-none"
                  onClick={() => window.open(`/company/${subdomain}`, "_blank")}
                >
                  <ExternalLink className="h-3 w-3 mr-1.5" />
                  Open
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

      {/* Notification Preferences */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Control which email notifications you receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="space-y-0.5">
              <Label htmlFor="notifyTaskCompletion" className="font-medium">Task Completion Emails</Label>
              <p className="text-xs text-muted-foreground">
                Receive an email when an employee completes a task you assigned
              </p>
            </div>
            <div className="flex items-center gap-2">
              {(loadingNotifyPref || savingNotifyPref) && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <Switch
                id="notifyTaskCompletion"
                checked={notifyTaskCompletion}
                onCheckedChange={handleNotifyPrefChange}
                disabled={loadingNotifyPref || savingNotifyPref}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <PaymentMethodCard company={company} />

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
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-4">
          <HiringSubscriptionSettings 
            company={company}
            onSubscriptionUpdated={onSettingsSaved}
          />

          {/* Payment Method */}
          <PaymentMethodCard company={company} />

          {/* Wallet / Credit Balance (display only when balance is positive) */}
          {creditBalance > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-medium">
                  <Wallet className="h-5 w-5" />
                  Wallet
                </CardTitle>
                <CardDescription>Credits are managed by Role Color Finder super-admins.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <span className="text-sm text-muted-foreground font-medium">Credit Balance</span>
                    <span className="font-semibold text-primary">${creditBalance.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Credits are automatically applied before charging your card on file.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {INTEGRATIONS_ENABLED && (
          <TabsContent value="integrations" className="space-y-4">
            <IntegrationsSettings company={company} companyUser={companyUser} onSettingsSaved={onSettingsSaved} />
          </TabsContent>
        )}

        <TabsContent value="api" className="space-y-4">
          {/* API Management - Coming Soon */}
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Key className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">API Access Coming Soon</h3>
            <p className="text-muted-foreground max-w-2xl mb-6">
              We are building secure API access so your team can automate hiring workflows, sync employee activity, and connect Role Color Finder data to your internal tools.
            </p>
            <div className="w-full max-w-2xl rounded-lg border bg-muted/30 p-4 text-left space-y-3">
              <p className="text-sm font-medium">What you will be able to do</p>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                <li>Create and manage users, invitations, and team assignments programmatically.</li>
                <li>Pull assessment outcomes, engagement events, and report-ready activity data.</li>
                <li>Use scoped keys, optional expiration dates, and audit visibility for better governance.</li>
              </ul>
              <p className="text-xs text-muted-foreground">
                Planned integrations include HRIS, ATS, and analytics platforms via secure token-based authentication.
              </p>
            </div>
          </div>
          {/* Hidden for now - uncomment when ready:
          <ApiKeyManagement companyId={company.id} />
          */}
        </TabsContent>

        {REPORTS_ENABLED && (
          <TabsContent value="reports" className="space-y-4">
            <ScheduledReportsManager companyId={company.id} />
          </TabsContent>
        )}
      </Tabs>

      {/* Delete Company Modal */}
      <DeleteCompanyModal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} company={company} />

    </div>
  );
}
