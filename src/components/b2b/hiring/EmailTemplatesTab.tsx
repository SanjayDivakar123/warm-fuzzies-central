import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Plus,
  Mail,
  FileText,
  Clock,
  Send,
  Calendar,
  HandshakeIcon,
  UserCheck,
  XCircle,
  Copy,
  MoreHorizontal,
  Eye,
  Edit,
  Trash,
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { format } from 'date-fns';

type EmailTemplate = Database['public']['Tables']['email_templates']['Row'];
type EmailTemplateType = Database['public']['Enums']['email_template_type'];

interface EmailTemplatesTabProps {
  company: { id: string; name: string };
  companyUser: { id: string; role: string } | null;
}

const TEMPLATE_TYPE_CONFIG: Record<EmailTemplateType, { label: string; icon: React.ReactNode; description: string }> = {
  candidate_invite: { 
    label: 'Candidate Invite', 
    icon: <Mail className="h-4 w-4" />,
    description: 'Invitation sent to candidates to apply',
  },
  interview_scheduled: { 
    label: 'Interview Scheduled', 
    icon: <Calendar className="h-4 w-4" />,
    description: 'Sent when an interview is scheduled',
  },
  interview_reminder: { 
    label: 'Interview Reminder', 
    icon: <Clock className="h-4 w-4" />,
    description: 'Reminder sent before the interview',
  },
  offer_letter: { 
    label: 'Offer Letter', 
    icon: <FileText className="h-4 w-4" />,
    description: 'Official job offer to the candidate',
  },
  offer_accepted: { 
    label: 'Offer Accepted', 
    icon: <UserCheck className="h-4 w-4" />,
    description: 'Confirmation when offer is accepted',
  },
  rejection: { 
    label: 'Rejection', 
    icon: <XCircle className="h-4 w-4" />,
    description: 'Professional rejection notification',
  },
  welcome: { 
    label: 'Welcome', 
    icon: <Send className="h-4 w-4" />,
    description: 'Welcome email for new hires',
  },
};

const DEFAULT_TEMPLATES: Partial<Record<EmailTemplateType, { subject: string; body_html: string }>> = {
  candidate_invite: {
    subject: 'Invitation to apply for {{position}} at {{company}}',
    body_html: `<p>Dear {{candidate_name}},</p>

<p>We would like to invite you to apply for the {{position}} role at {{company}}.</p>

<p>Please click the link below to submit your application.</p>

<p>Best regards,<br/>The {{company}} Team</p>`,
  },
  interview_scheduled: {
    subject: 'Interview Scheduled: {{position}} at {{company}}',
    body_html: `<p>Dear {{candidate_name}},</p>

<p>We are pleased to invite you to interview for the {{position}} position at {{company}}.</p>

<p><strong>Interview Details:</strong></p>
<ul>
<li>Date: {{interview_date}}</li>
<li>Time: {{interview_time}}</li>
<li>Duration: {{interview_duration}}</li>
<li>Location: {{interview_location}}</li>
</ul>

<p>Please confirm your attendance by replying to this email.</p>

<p>Best regards,<br/>The {{company}} Team</p>`,
  },
  rejection: {
    subject: 'Update on your application to {{company}}',
    body_html: `<p>Dear {{candidate_name}},</p>

<p>Thank you for your interest in the {{position}} position at {{company}} and for taking the time to apply.</p>

<p>After careful consideration, we have decided to move forward with other candidates whose experience more closely matches our current needs.</p>

<p>We appreciate your interest in our company and encourage you to apply for future openings that match your qualifications.</p>

<p>Best regards,<br/>The {{company}} Team</p>`,
  },
};

export default function EmailTemplatesTab({
  company,
  companyUser,
}: EmailTemplatesTabProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    template_type: 'candidate_invite' as EmailTemplateType,
    subject: '',
    body_html: '',
    is_active: true,
  });

  const { toast } = useToast();
  const isHROrAdmin = companyUser?.role === 'admin' || companyUser?.role === 'hr';

  useEffect(() => {
    fetchTemplates();
  }, [company.id]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('company_id', company.id)
        .order('template_type')
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (err: any) {
      console.error('Error fetching templates:', err);
      toast({
        title: 'Error loading templates',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = (type?: EmailTemplateType) => {
    const defaultContent = type && DEFAULT_TEMPLATES[type];
    setFormData({
      name: type ? TEMPLATE_TYPE_CONFIG[type].label : '',
      template_type: type || 'candidate_invite',
      subject: defaultContent?.subject || '',
      body_html: defaultContent?.body_html || '',
      is_active: true,
    });
    setEditingTemplate(null);
    setShowDialog(true);
  };

  const openEditDialog = (template: EmailTemplate) => {
    setFormData({
      name: template.name,
      template_type: template.template_type,
      subject: template.subject,
      body_html: template.body_html || '',
      is_active: template.is_active,
    });
    setEditingTemplate(template);
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.subject.trim() || !formData.body_html.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from('email_templates')
          .update({
            name: formData.name,
            template_type: formData.template_type,
            subject: formData.subject,
            body_html: formData.body_html,
            is_active: formData.is_active,
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast({ title: 'Template updated' });
      } else {
        const { error } = await supabase
          .from('email_templates')
          .insert({
            company_id: company.id,
            name: formData.name,
            template_type: formData.template_type,
            subject: formData.subject,
            body_html: formData.body_html,
            is_active: formData.is_active,
          });

        if (error) throw error;
        toast({ title: 'Template created' });
      }

      setShowDialog(false);
      fetchTemplates();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Template deleted' });
      fetchTemplates();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const duplicateTemplate = async (template: EmailTemplate) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .insert({
          company_id: company.id,
          name: `${template.name} (Copy)`,
          template_type: template.template_type,
          subject: template.subject,
          body_html: template.body_html,
          is_active: false,
        });

      if (error) throw error;
      toast({ title: 'Template duplicated' });
      fetchTemplates();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const toggleActive = async (template: EmailTemplate) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;
      fetchTemplates();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  // Group templates by type
  const groupedTemplates = templates.reduce((acc, template) => {
    const type = template.template_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(template);
    return acc;
  }, {} as Record<EmailTemplateType, EmailTemplate[]>);

  // Available template types (to suggest creating)
  const missingTypes = (Object.keys(TEMPLATE_TYPE_CONFIG) as EmailTemplateType[])
    .filter(type => !groupedTemplates[type]?.length);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick create suggestions */}
      {isHROrAdmin && missingTypes.length > 0 && (
        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Suggested Templates</CardTitle>
            <CardDescription className="text-xs">
              Create these common templates to streamline your hiring communications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {missingTypes.slice(0, 4).map(type => (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  onClick={() => openCreateDialog(type)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {TEMPLATE_TYPE_CONFIG[type].label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Email Templates</h3>
          <p className="text-sm text-muted-foreground">
            {templates.length} template{templates.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isHROrAdmin && (
          <Button onClick={() => openCreateDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        )}
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No email templates yet. Create your first template to standardize your hiring communications.
            </p>
            {isHROrAdmin && (
              <Button onClick={() => openCreateDialog('candidate_invite')}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Template
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => {
            const typeConfig = TEMPLATE_TYPE_CONFIG[template.template_type];
            return (
              <Card key={template.id} className={!template.is_active ? 'opacity-60' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-primary/10 rounded">
                        {typeConfig.icon}
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
                        <Badge variant="outline" className="text-xs mt-0.5">
                          {typeConfig.label}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onFocus={(e) => {
                            e.currentTarget.blur();
                          }}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setEditingTemplate(template);
                          setFormData({
                            name: template.name,
                            template_type: template.template_type,
                            subject: template.subject,
                            body_html: template.body_html || '',
                            is_active: template.is_active,
                          });
                          setShowPreview(true);
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        {isHROrAdmin && (
                          <>
                            <DropdownMenuItem onClick={() => openEditDialog(template)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateTemplate(template)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleActive(template)}>
                              {template.is_active ? (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => deleteTemplate(template.id)}
                              className="text-destructive"
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Subject:
                  </p>
                  <p className="text-sm truncate mb-3">{template.subject}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {(template.body_html || '').slice(0, 100)}...
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <span className="text-xs text-muted-foreground">
                      Updated {format(new Date(template.updated_at), 'MMM d, yyyy')}
                    </span>
                    {!template.is_active && (
                      <Badge variant="secondary" className="text-xs">Inactive</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
            <DialogDescription>
              Use variables like {'{{candidate_name}}'}, {'{{position}}'}, {'{{company}}'} in your template.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Interview Confirmation"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.template_type}
                  onValueChange={(v) => {
                    const newType = v as EmailTemplateType;
                    const defaultContent = DEFAULT_TEMPLATES[newType];
                    setFormData({ 
                      ...formData, 
                      template_type: newType,
                      name: formData.name || TEMPLATE_TYPE_CONFIG[newType].label,
                      subject: formData.subject || defaultContent?.subject || '',
                      body_html: formData.body_html || defaultContent?.body_html || '',
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TEMPLATE_TYPE_CONFIG) as EmailTemplateType[]).map(type => (
                      <SelectItem key={type} value={type}>
                        {TEMPLATE_TYPE_CONFIG[type].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Subject Line *</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., Your interview with {{company}} is confirmed"
              />
            </div>

            <div className="space-y-2">
              <Label>Email Body *</Label>
              <Textarea
                value={formData.body_html}
                onChange={(e) => setFormData({ ...formData, body_html: e.target.value })}
                placeholder="Write your email content here..."
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            <div className="bg-muted/30 p-3 rounded-lg">
              <p className="text-xs font-medium mb-2">Available Variables:</p>
              <div className="flex flex-wrap gap-1.5">
                {['{{candidate_name}}', '{{candidate_email}}', '{{position}}', '{{company}}', 
                  '{{interview_date}}', '{{interview_time}}', '{{interview_location}}',
                  '{{salary}}', '{{start_date}}', '{{recruiter_name}}'].map(v => (
                  <Badge 
                    key={v} 
                    variant="outline" 
                    className="text-xs cursor-pointer hover:bg-muted"
                    onClick={() => {
                      const textarea = document.querySelector('textarea');
                      if (textarea) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const newBody = formData.body_html.slice(0, start) + v + formData.body_html.slice(end);
                        setFormData({ ...formData, body_html: newBody });
                      }
                    }}
                  >
                    {v}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingTemplate ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Subject:</p>
              <p className="font-medium">{formData.subject}</p>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground mb-2">Body:</p>
              <pre className="text-sm whitespace-pre-wrap font-sans">{formData.body_html}</pre>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
