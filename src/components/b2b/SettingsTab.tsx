import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Eye, CheckCircle2, CreditCard, X, Trash2 } from 'lucide-react';
import AssessmentPreviewModal from './AssessmentPreviewModal';
import BillingModal from './BillingModal';
import DeleteCompanyModal from './DeleteCompanyModal';
import PaymentMethodCard from './PaymentMethodCard';

interface SettingsTabProps {
  company: any;
  onSettingsSaved?: () => void;
}

export default function SettingsTab({ company, onSettingsSaved }: SettingsTabProps) {
  const [logoUrl, setLogoUrl] = useState(company.logo_url || '');
  const [primaryColor, setPrimaryColor] = useState(company.primary_color);
  const [secondaryColor, setSecondaryColor] = useState(company.secondary_color);
  const [subdomain, setSubdomain] = useState(company.subdomain);
  const [customDomain, setCustomDomain] = useState(company.custom_domain || '');
  const [customDomainEnabled, setCustomDomainEnabled] = useState(company.custom_domain_enabled);
  const [assessmentType, setAssessmentType] = useState<'25q' | '50q'>(company.assessment_type);
  const [googleSsoEnabled, setGoogleSsoEnabled] = useState(company.google_sso_enabled || false);
  const [googleWorkspaceDomain, setGoogleWorkspaceDomain] = useState(company.google_workspace_domain || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewType, setPreviewType] = useState<'25q' | '50q'>('25q');
  const [billingOpen, setBillingOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (PNG, JPG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 2MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${company.id}/logo-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

      const newLogoUrl = urlData.publicUrl;
      setLogoUrl(newLogoUrl);

      // Auto-save the logo URL
      const { error: updateError } = await supabase
        .from('companies')
        .update({ logo_url: newLogoUrl })
        .eq('id', company.id);

      if (updateError) throw updateError;

      toast({
        title: 'Logo uploaded',
        description: 'Your company logo has been updated',
      });

      if (onSettingsSaved) {
        onSettingsSaved();
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload logo',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    setLogoUrl('');
    
    const { error } = await supabase
      .from('companies')
      .update({ logo_url: '' })
      .eq('id', company.id);

    if (!error && onSettingsSaved) {
      onSettingsSaved();
      toast({
        title: 'Logo removed',
        description: 'Your company logo has been removed',
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          logo_url: logoUrl,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          subdomain,
          custom_domain: customDomain,
          custom_domain_enabled: customDomainEnabled,
          assessment_type: assessmentType,
          google_sso_enabled: googleSsoEnabled,
          google_workspace_domain: googleWorkspaceDomain || null,
        })
        .eq('id', company.id);

      if (error) throw error;

      toast({
        title: 'Settings saved',
        description: 'Your company settings have been updated.',
      });

      // Refresh company data in parent
      if (onSettingsSaved) {
        onSettingsSaved();
      }
    } catch (error: any) {
      toast({
        title: 'Error saving settings',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>Customize your company portal appearance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Company Logo</Label>
            
            {/* Logo Preview */}
            {logoUrl && (
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
                <img 
                  src={logoUrl} 
                  alt="Company logo" 
                  className="h-16 w-auto max-w-[200px] object-contain"
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRemoveLogo}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            )}

            {/* Upload Button */}
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
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Upload a PNG or JPG image (max 2MB). Recommended size: 200x50px
            </p>
          </div>

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

      <Card>
        <CardHeader>
          <CardTitle>Domain Settings</CardTitle>
          <CardDescription>Configure your company subdomain and custom domain</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subdomain">Subdomain</Label>
            <div className="flex items-center gap-2">
              <Input
                id="subdomain"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
              />
              <span className="text-sm text-muted-foreground">.rolecolorfinder.com</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customDomain">Custom Domain</Label>
            <Input
              id="customDomain"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="portal.yourcompany.com"
            />
            <div className="flex items-center space-x-2 mt-2">
              <Switch
                id="customDomainEnabled"
                checked={customDomainEnabled}
                onCheckedChange={setCustomDomainEnabled}
              />
              <Label htmlFor="customDomainEnabled">Enable Custom Domain</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google SSO Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
          <CardDescription>
            Allow employees and admins to sign in with their Google account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="googleSsoEnabled"
              checked={googleSsoEnabled}
              onCheckedChange={setGoogleSsoEnabled}
            />
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
                If set, only users with this email domain can sign in via Google (e.g., @yourcompany.com).
                Leave empty to allow any Google account that has been invited.
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


      {/* Assessment Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Type</CardTitle>
          <CardDescription>Choose which assessment your employees will take</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 25 Question Assessment */}
          <div 
            className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all cursor-pointer ${
              assessmentType === '25q' 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/40'
            }`}
            onClick={() => setAssessmentType('25q')}
          >
            <div className="flex items-center gap-3">
              {assessmentType === '25q' && (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              )}
              <div>
                <p className="font-medium">25 Question Assessment</p>
                <p className="text-sm text-muted-foreground">
                  Quick assessment (~10 minutes) • 5 sections
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewType('25q');
                setPreviewOpen(true);
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>

          {/* 50 Question Assessment */}
          <div 
            className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all cursor-pointer ${
              assessmentType === '50q' 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/40'
            }`}
            onClick={() => setAssessmentType('50q')}
          >
            <div className="flex items-center gap-3">
              {assessmentType === '50q' && (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              )}
              <div>
                <p className="font-medium">50 Question Assessment</p>
                <p className="text-sm text-muted-foreground">
                  Comprehensive assessment (~20 minutes) • 5 sections
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewType('50q');
                setPreviewOpen(true);
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>

          {assessmentType !== company.assessment_type && (
            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              Assessment type will be updated when you save settings. This affects new assessments only.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Seat Management */}
      <Card>
        <CardHeader>
          <CardTitle>Seat Management</CardTitle>
          <CardDescription>View and manage employee seats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">Current Seats</span>
              <span className="font-semibold text-lg">{company.seats_purchased}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">Price per Seat</span>
              <span className="font-medium">$20 (one-time)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <PaymentMethodCard company={company} />

      {/* Billing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing
          </CardTitle>
          <CardDescription>Manage your billing and add seats</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            className="w-full gap-2"
            onClick={() => setBillingOpen(true)}
          >
            <CreditCard className="h-4 w-4" />
            Manage Billing
          </Button>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save All Settings
      </Button>

      {/* Danger Zone - Delete Company */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently delete this company and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Once you delete your company, there is no going back. All users, assessments, tasks, and settings will be permanently removed.
          </p>
          <Button 
            variant="destructive" 
            className="w-full gap-2"
            onClick={() => setDeleteModalOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete Company
          </Button>
        </CardContent>
      </Card>

      {/* Assessment Preview Modal */}
      <AssessmentPreviewModal 
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        assessmentType={previewType}
      />

      {/* Billing Modal */}
      <BillingModal
        open={billingOpen}
        onClose={() => setBillingOpen(false)}
        company={company}
        onSeatsUpdated={() => {
          if (onSettingsSaved) onSettingsSaved();
        }}
      />

      {/* Delete Company Modal */}
      <DeleteCompanyModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        company={company}
      />
    </div>
  );
}
