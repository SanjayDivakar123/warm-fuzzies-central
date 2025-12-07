import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Eye, CheckCircle2 } from 'lucide-react';
import AssessmentPreviewModal from './AssessmentPreviewModal';

interface SettingsTabProps {
  company: any;
  onSettingsSaved?: () => void;
}

export default function SettingsTab({ company, onSettingsSaved }: SettingsTabProps) {
  const [logoUrl, setLogoUrl] = useState(company.logo_url || '');
  const [primaryColor, setPrimaryColor] = useState(company.primary_color);
  const [secondaryColor, setSecondaryColor] = useState(company.secondary_color);
  const [subdomain, setSubdomain] = useState(company.subdomain);
  const [googleSsoEnabled, setGoogleSsoEnabled] = useState(company.google_sso_enabled);
  const [googleWorkspaceDomain, setGoogleWorkspaceDomain] = useState(company.google_workspace_domain || '');
  const [customDomain, setCustomDomain] = useState(company.custom_domain || '');
  const [customDomainEnabled, setCustomDomainEnabled] = useState(company.custom_domain_enabled);
  const [assessmentType, setAssessmentType] = useState<'25q' | '50q'>(company.assessment_type);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewType, setPreviewType] = useState<'25q' | '50q'>('25q');
  const { toast } = useToast();

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
          google_sso_enabled: googleSsoEnabled,
          google_workspace_domain: googleWorkspaceDomain,
          custom_domain: customDomain,
          custom_domain_enabled: customDomainEnabled,
          assessment_type: assessmentType,
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
            <Label htmlFor="logoUrl">Logo URL</Label>
            <div className="flex gap-2">
              <Input
                id="logoUrl"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
              />
              <Button variant="outline" size="icon">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
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
            <Label htmlFor="customDomain">Custom Domain (+$10/mo)</Label>
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

      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>Configure authentication options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="googleSso">Google SSO (+$10/mo)</Label>
              <p className="text-sm text-muted-foreground">
                Enable Google Workspace single sign-on
              </p>
            </div>
            <Switch
              id="googleSso"
              checked={googleSsoEnabled}
              onCheckedChange={setGoogleSsoEnabled}
            />
          </div>

          {googleSsoEnabled && (
            <div className="space-y-2">
              <Label htmlFor="googleWorkspaceDomain">Google Workspace Domain</Label>
              <Input
                id="googleWorkspaceDomain"
                value={googleWorkspaceDomain}
                onChange={(e) => setGoogleWorkspaceDomain(e.target.value)}
                placeholder="company.com"
              />
            </div>
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

      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>Manage your subscription and seats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Seats:</span>
              <span className="font-medium">{company.seats_purchased}</span>
            </div>
            <Button variant="outline" className="w-full">
              Manage Billing
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save All Settings
      </Button>

      {/* Assessment Preview Modal */}
      <AssessmentPreviewModal 
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        assessmentType={previewType}
      />
    </div>
  );
}
