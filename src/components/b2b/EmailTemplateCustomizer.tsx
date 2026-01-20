import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, ChevronDown, ChevronUp, Loader2, Eye, RotateCcw, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface EmailTemplateCustomizerProps {
  company: any;
  onUpdate: () => void;
}

const DEFAULT_SUBJECT = "You're invited to take the Role Color Assessment for {{company_name}}";
const DEFAULT_GREETING = "Hi there,";
const DEFAULT_BODY = "{{company_name}} has invited you to take the Role Color Assessment. This assessment will help identify your work style and how you collaborate best with your team.";
const DEFAULT_CTA = "Start Assessment";

export default function EmailTemplateCustomizer({ company, onUpdate }: EmailTemplateCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const [subject, setSubject] = useState(company.email_template_subject || DEFAULT_SUBJECT);
  const [greeting, setGreeting] = useState(company.email_template_greeting || DEFAULT_GREETING);
  const [body, setBody] = useState(company.email_template_body || DEFAULT_BODY);
  const [ctaText, setCtaText] = useState(company.email_template_cta_text || DEFAULT_CTA);
  const [showLogo, setShowLogo] = useState(company.email_show_logo !== false);

  useEffect(() => {
    setSubject(company.email_template_subject || DEFAULT_SUBJECT);
    setGreeting(company.email_template_greeting || DEFAULT_GREETING);
    setBody(company.email_template_body || DEFAULT_BODY);
    setCtaText(company.email_template_cta_text || DEFAULT_CTA);
    setShowLogo(company.email_show_logo !== false);
  }, [company]);

  const replaceVariables = (text: string) => {
    return text
      .replace(/\{\{company_name\}\}/g, company.name || 'Your Company')
      .replace(/\{\{invite_code\}\}/g, 'XXXX-XXXX')
      .replace(/\{\{email\}\}/g, 'employee@example.com');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          email_template_subject: subject === DEFAULT_SUBJECT ? null : subject,
          email_template_greeting: greeting === DEFAULT_GREETING ? null : greeting,
          email_template_body: body === DEFAULT_BODY ? null : body,
          email_template_cta_text: ctaText === DEFAULT_CTA ? null : ctaText,
          email_show_logo: showLogo,
        })
        .eq('id', company.id);

      if (error) throw error;

      toast({
        title: 'Template saved',
        description: 'Your email template has been updated.',
      });
      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Error saving template',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSubject(DEFAULT_SUBJECT);
    setGreeting(DEFAULT_GREETING);
    setBody(DEFAULT_BODY);
    setCtaText(DEFAULT_CTA);
    setShowLogo(true);
  };

  const renderEmailPreview = () => {
    const logoUrl = company.logo_url;
    
    return (
      <div className="font-sans text-sm max-w-[500px] mx-auto">
        {/* Header */}
        <div 
          className="text-center p-6 rounded-t-lg"
          style={{ background: 'linear-gradient(135deg, #9b87f5 0%, #7E69AB 100%)' }}
        >
          <h1 className="text-white text-xl font-bold m-0">{company.name || 'Your Company'}</h1>
        </div>
        
        {/* Body */}
        <div className="bg-white p-6 border-x border-b border-border">
          {/* Company logo */}
          {showLogo && logoUrl && (
            <div className="text-center mb-4">
              <img 
                src={logoUrl} 
                alt={company.name} 
                className="max-h-12 max-w-[150px] mx-auto object-contain"
              />
            </div>
          )}
          
          <h2 className="text-lg font-semibold text-foreground mb-4">You've been invited!</h2>
          
          <p className="text-muted-foreground mb-2">{replaceVariables(greeting)}</p>
          
          <p className="text-muted-foreground mb-6">{replaceVariables(body)}</p>
          
          {/* Invite code box */}
          <div className="bg-muted rounded-lg p-4 text-center mb-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Your Invite Code</p>
            <p className="text-2xl font-bold tracking-[0.3em] text-primary font-mono">XXXX-XXXX</p>
          </div>
          
          {/* CTA Button */}
          <div className="text-center mb-4">
            <span 
              className="inline-block px-8 py-3 rounded-lg text-white font-semibold"
              style={{ background: 'linear-gradient(135deg, #9b87f5 0%, #7E69AB 100%)' }}
            >
              {ctaText}
            </span>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-muted p-4 text-center rounded-b-lg">
          <p className="text-xs text-muted-foreground">
            Powered by <span className="font-semibold text-primary">RoleColorFinder</span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base">Customize Email Template</CardTitle>
                  <CardDescription className="text-sm">
                    Personalize the invite email sent to your team members
                  </CardDescription>
                </div>
              </div>
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Subject Line */}
            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={DEFAULT_SUBJECT}
              />
              <p className="text-xs text-muted-foreground">
                Use {'{{company_name}}'} to insert your company name
              </p>
            </div>

            {/* Show Logo Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Company Logo</Label>
                <p className="text-xs text-muted-foreground">
                  {company.logo_url 
                    ? 'Display your logo in the email' 
                    : 'Upload a logo in Settings to enable this'}
                </p>
              </div>
              <Switch
                checked={showLogo}
                onCheckedChange={setShowLogo}
                disabled={!company.logo_url}
              />
            </div>

            {/* Greeting */}
            <div className="space-y-2">
              <Label htmlFor="greeting">Greeting</Label>
              <Input
                id="greeting"
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                placeholder={DEFAULT_GREETING}
              />
            </div>

            {/* Body Text */}
            <div className="space-y-2">
              <Label htmlFor="body">Email Body</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={DEFAULT_BODY}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Available variables: {'{{company_name}}'}, {'{{email}}'}
              </p>
            </div>

            {/* CTA Button Text */}
            <div className="space-y-2">
              <Label htmlFor="cta">Button Text</Label>
              <Input
                id="cta"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder={DEFAULT_CTA}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Email Preview</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Subject:</strong> {replaceVariables(subject)}
                    </p>
                    {renderEmailPreview()}
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>

              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Template
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
