import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Globe,
  Palette,
  FileText,
  Eye,
  Save,
  ExternalLink,
  Loader2,
  Image,
  Share2,
  Copy,
  Check,
  Plus,
  X,
} from 'lucide-react';

interface CareerPageSettings {
  id?: string;
  company_id: string;
  is_public: boolean;
  custom_slug: string;
  page_title: string;
  meta_description: string;
  hero_headline: string;
  hero_subheadline: string;
  hero_image_url: string;
  about_company: string;
  company_culture: string;
  benefits: string[];
  social_links: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  primary_color: string;
  secondary_color: string;
  custom_css: string;
  show_testimonials: boolean;
  show_team_section: boolean;
}

interface CareerPageSettingsUIProps {
  companyId: string;
  companyName: string;
  companySlug: string;
}

export default function CareerPageSettingsUI({
  companyId,
  companyName,
  companySlug,
}: CareerPageSettingsUIProps) {
  const [settings, setSettings] = useState<CareerPageSettings>({
    company_id: companyId,
    is_public: true,
    custom_slug: companySlug,
    page_title: `Careers at ${companyName}`,
    meta_description: `Join ${companyName}! Explore open positions and discover why our team loves working here.`,
    hero_headline: `Join Our Team`,
    hero_subheadline: `Build your career with ${companyName}`,
    hero_image_url: '',
    about_company: '',
    company_culture: '',
    benefits: [],
    social_links: {},
    primary_color: '#2563eb',
    secondary_color: '#1e40af',
    custom_css: '',
    show_testimonials: true,
    show_team_section: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newBenefit, setNewBenefit] = useState('');
  const { toast } = useToast();

  const careersUrl = `https://rolecolorfinder.com/careers/${settings.custom_slug || companySlug}`;

  useEffect(() => {
    fetchSettings();
  }, [companyId]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('career_page_settings')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          ...data,
          benefits: data.benefits || [],
          social_links: data.social_links || {},
        } as CareerPageSettings);
      }
    } catch (err) {
      console.error('Error fetching career page settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const settingsData = {
        ...settings,
        company_id: companyId,
      };

      if (settings.id) {
        const { error } = await supabase
          .from('career_page_settings')
          .update(settingsData)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('career_page_settings')
          .insert(settingsData)
          .select('id')
          .single();
        if (error) throw error;
        setSettings(prev => ({ ...prev, id: data.id }));
      }

      toast({
        title: 'Settings Saved',
        description: 'Your careers page settings have been updated.',
      });
    } catch (err: any) {
      toast({
        title: 'Error Saving',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(careersUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'URL Copied',
      description: 'Careers page URL has been copied to clipboard.',
    });
  };

  const addBenefit = () => {
    if (newBenefit.trim()) {
      setSettings(prev => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit.trim()],
      }));
      setNewBenefit('');
    }
  };

  const removeBenefit = (index: number) => {
    setSettings(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  const updateSocialLink = (platform: string, url: string) => {
    setSettings(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: url,
      },
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading career page settings...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Career Page Settings
              </CardTitle>
              <CardDescription>
                Customize your public careers page
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={copyUrl}>
                {copied ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Copy URL
              </Button>
              <Button variant="outline" asChild>
                <a href={careersUrl} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </a>
              </Button>
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Label>Page Status:</Label>
              <Switch
                checked={settings.is_public}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({ ...prev, is_public: checked }))
                }
              />
              <Badge variant={settings.is_public ? 'default' : 'secondary'}>
                {settings.is_public ? 'Public' : 'Private'}
              </Badge>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2 flex-1">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <code className="text-sm bg-muted px-2 py-1 rounded">
                {careersUrl}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content">
            <FileText className="h-4 w-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Palette className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Globe className="h-4 w-4 mr-2" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="social">
            <Share2 className="h-4 w-4 mr-2" />
            Social
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Page Content</CardTitle>
              <CardDescription>
                Customize the text and sections on your careers page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hero Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Hero Section</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Headline</Label>
                    <Input
                      value={settings.hero_headline}
                      onChange={(e) =>
                        setSettings(prev => ({ ...prev, hero_headline: e.target.value }))
                      }
                      placeholder="Join Our Team"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subheadline</Label>
                    <Input
                      value={settings.hero_subheadline}
                      onChange={(e) =>
                        setSettings(prev => ({ ...prev, hero_subheadline: e.target.value }))
                      }
                      placeholder="Build your career with us"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Hero Image URL</Label>
                  <Input
                    value={settings.hero_image_url}
                    onChange={(e) =>
                      setSettings(prev => ({ ...prev, hero_image_url: e.target.value }))
                    }
                    placeholder="https://example.com/hero-image.jpg"
                  />
                </div>
              </div>

              <Separator />

              {/* About Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">About Company</h3>
                <div className="space-y-2">
                  <Label>Company Description</Label>
                  <Textarea
                    value={settings.about_company}
                    onChange={(e) =>
                      setSettings(prev => ({ ...prev, about_company: e.target.value }))
                    }
                    placeholder="Tell candidates about your company..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company Culture</Label>
                  <Textarea
                    value={settings.company_culture}
                    onChange={(e) =>
                      setSettings(prev => ({ ...prev, company_culture: e.target.value }))
                    }
                    placeholder="Describe your company culture..."
                    rows={4}
                  />
                </div>
              </div>

              <Separator />

              {/* Benefits */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Benefits & Perks</h3>
                <div className="flex gap-2">
                  <Input
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    placeholder="Add a benefit..."
                    onKeyDown={(e) => e.key === 'Enter' && addBenefit()}
                  />
                  <Button onClick={addBenefit}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {settings.benefits.map((benefit, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {benefit}
                      <button
                        onClick={() => removeBenefit(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Section Toggles */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Page Sections</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Team Testimonials</p>
                      <p className="text-sm text-muted-foreground">
                        Show employee testimonials on the page
                      </p>
                    </div>
                    <Switch
                      checked={settings.show_testimonials}
                      onCheckedChange={(checked) =>
                        setSettings(prev => ({ ...prev, show_testimonials: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Team Section</p>
                      <p className="text-sm text-muted-foreground">
                        Display team members on the page
                      </p>
                    </div>
                    <Switch
                      checked={settings.show_team_section}
                      onCheckedChange={(checked) =>
                        setSettings(prev => ({ ...prev, show_team_section: checked }))
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Brand Customization</CardTitle>
              <CardDescription>
                Customize colors and styling to match your brand
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) =>
                        setSettings(prev => ({ ...prev, primary_color: e.target.value }))
                      }
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.primary_color}
                      onChange={(e) =>
                        setSettings(prev => ({ ...prev, primary_color: e.target.value }))
                      }
                      placeholder="#2563eb"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.secondary_color}
                      onChange={(e) =>
                        setSettings(prev => ({ ...prev, secondary_color: e.target.value }))
                      }
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.secondary_color}
                      onChange={(e) =>
                        setSettings(prev => ({ ...prev, secondary_color: e.target.value }))
                      }
                      placeholder="#1e40af"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Custom CSS (Advanced)</Label>
                <Textarea
                  value={settings.custom_css}
                  onChange={(e) =>
                    setSettings(prev => ({ ...prev, custom_css: e.target.value }))
                  }
                  placeholder=".careers-page { /* custom styles */ }"
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Add custom CSS to further customize the appearance of your careers page.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>
                Optimize your careers page for search engines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Custom URL Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    rolecolorfinder.com/careers/
                  </span>
                  <Input
                    value={settings.custom_slug}
                    onChange={(e) =>
                      setSettings(prev => ({ ...prev, custom_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))
                    }
                    placeholder={companySlug}
                    className="max-w-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Page Title</Label>
                <Input
                  value={settings.page_title}
                  onChange={(e) =>
                    setSettings(prev => ({ ...prev, page_title: e.target.value }))
                  }
                  placeholder={`Careers at ${companyName}`}
                />
                <p className="text-xs text-muted-foreground">
                  {settings.page_title.length}/60 characters (recommended)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea
                  value={settings.meta_description}
                  onChange={(e) =>
                    setSettings(prev => ({ ...prev, meta_description: e.target.value }))
                  }
                  placeholder="Join our team! Explore open positions..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {settings.meta_description.length}/160 characters (recommended)
                </p>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Search Preview</Label>
                <div className="border rounded-lg p-4 bg-muted/30">
                  <p className="text-blue-600 text-lg hover:underline cursor-pointer">
                    {settings.page_title || `Careers at ${companyName}`}
                  </p>
                  <p className="text-green-700 text-sm">{careersUrl}</p>
                  <p className="text-sm text-gray-600">
                    {settings.meta_description || `Join ${companyName}! Explore open positions...`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
              <CardDescription>
                Add social media links to your careers page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>LinkedIn</Label>
                <Input
                  value={settings.social_links.linkedin || ''}
                  onChange={(e) => updateSocialLink('linkedin', e.target.value)}
                  placeholder="https://linkedin.com/company/your-company"
                />
              </div>
              <div className="space-y-2">
                <Label>Twitter / X</Label>
                <Input
                  value={settings.social_links.twitter || ''}
                  onChange={(e) => updateSocialLink('twitter', e.target.value)}
                  placeholder="https://twitter.com/your-company"
                />
              </div>
              <div className="space-y-2">
                <Label>Facebook</Label>
                <Input
                  value={settings.social_links.facebook || ''}
                  onChange={(e) => updateSocialLink('facebook', e.target.value)}
                  placeholder="https://facebook.com/your-company"
                />
              </div>
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input
                  value={settings.social_links.instagram || ''}
                  onChange={(e) => updateSocialLink('instagram', e.target.value)}
                  placeholder="https://instagram.com/your-company"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
