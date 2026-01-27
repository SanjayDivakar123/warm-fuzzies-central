import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Link2, Copy, Check } from 'lucide-react';
import { AssessmentCategory } from '@/lib/assessmentQuestionLoader';

interface CreateApplicationLinkModalProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  companySubdomain: string;
  onLinkCreated: () => void;
}

type AssessmentType = '25q' | '50q';

const ASSESSMENT_CATEGORIES: { value: AssessmentCategory; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'entrepreneur', label: 'Entrepreneur' },
  { value: 'executive', label: 'Executive / Senior Leader' },
  { value: 'manager', label: 'Manager / Mid-Level Leader' },
];

const ASSESSMENT_TYPES: { value: AssessmentType; label: string }[] = [
  { value: '25q', label: '25 Questions' },
  { value: '50q', label: '50 Questions' },
];

const ROLE_COLORS = ['yellow', 'red', 'green', 'blue'];

export default function CreateApplicationLinkModal({
  open,
  onClose,
  companyId,
  companySubdomain,
  onLinkCreated,
}: CreateApplicationLinkModalProps) {
  const [positionTitle, setPositionTitle] = useState('');
  const [idealRoleColor, setIdealRoleColor] = useState<string>('');
  const [assessmentCategory, setAssessmentCategory] = useState<AssessmentCategory>('professional');
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('25q');
  const [maxApplications, setMaxApplications] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!positionTitle.trim()) {
      toast({
        title: 'Position title required',
        description: 'Please enter a position title',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('candidate_application_links')
        .insert({
          company_id: companyId,
          position_title: positionTitle.trim(),
          ideal_role_color: idealRoleColor || null,
          assessment_category: assessmentCategory,
          assessment_type: assessmentType,
          max_applications: maxApplications ? parseInt(maxApplications) : null,
        })
        .select()
        .single();

      if (error) throw error;

      const linkUrl = `https://rolecolorfinder.com/apply/${companySubdomain}/${data.link_code}`;
      setCreatedLink(linkUrl);
      onLinkCreated();

      toast({
        title: 'Application link created!',
        description: 'Share this link with candidates.',
      });
    } catch (error: any) {
      toast({
        title: 'Error creating link',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (createdLink) {
      navigator.clipboard.writeText(createdLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setPositionTitle('');
    setIdealRoleColor('');
    setAssessmentCategory('professional');
    setAssessmentType('25q');
    setMaxApplications('');
    setCreatedLink(null);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Create Application Link
          </DialogTitle>
          <DialogDescription>
            Create a shareable link for candidates to apply and take an assessment.
          </DialogDescription>
        </DialogHeader>

        {createdLink ? (
          <div className="py-6">
            <Label className="text-sm text-muted-foreground">Application Link</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={createdLink}
                readOnly
                className="font-mono text-sm"
              />
              <Button onClick={copyToClipboard} variant="outline">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Share this link with candidates. They can apply and take the assessment without an invitation.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="position">Position Title *</Label>
              <Input
                id="position"
                type="text"
                placeholder="e.g., Software Engineer, Sales Manager"
                value={positionTitle}
                onChange={(e) => setPositionTitle(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ideal Role Color</Label>
                <Select
                  value={idealRoleColor}
                  onValueChange={setIdealRoleColor}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any color</SelectItem>
                    {ROLE_COLORS.map((color) => (
                      <SelectItem key={color} value={color} className="capitalize">
                        {color.charAt(0).toUpperCase() + color.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Max Applications</Label>
                <Input
                  type="number"
                  placeholder="Unlimited"
                  value={maxApplications}
                  onChange={(e) => setMaxApplications(e.target.value)}
                  disabled={loading}
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Assessment Category *</Label>
                <Select
                  value={assessmentCategory}
                  onValueChange={(v) => setAssessmentCategory(v as AssessmentCategory)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSESSMENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assessment Length *</Label>
                <Select
                  value={assessmentType}
                  onValueChange={(v) => setAssessmentType(v as AssessmentType)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select length" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSESSMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {createdLink ? (
            <Button onClick={handleClose}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={loading || !positionTitle.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Link'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}