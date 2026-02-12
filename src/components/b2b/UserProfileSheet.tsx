import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Mail,
  Briefcase,
  Sparkles,
  Save,
  Loader2,
  X,
  Plus,
  FileText,
  Award,
  User,
  Calendar,
} from 'lucide-react';

interface UserProfileSheetProps {
  userId: string | null;
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly?: boolean;
  onUserUpdate?: () => void;
}

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  job_role: string | null;
  job_description: string | null;
  skills: string[] | null;
  role: string;
  status: string;
  assessment_category: string | null;
  assessment_completed_at: string | null;
  assessment_result_id: string | null;
  invited_at: string | null;
  joined_at: string | null;
}

interface AssessmentResult {
  dominantColor: string;
  scores: { yellow: number; red: number; green: number; blue: number };
  totalQuestions: number;
}

const COLOR_INFO: Record<string, { name: string; color: string; description: string; traits: string[] }> = {
  yellow: {
    name: 'Yellow - The Strategist',
    color: '#EAB308',
    description: 'Strategic thinkers who excel at planning, goal-setting, and driving results.',
    traits: ['Results-oriented', 'Goal-driven', 'Strategic', 'Decisive'],
  },
  red: {
    name: 'Red - The Connector',
    color: '#EF4444',
    description: 'Natural relationship builders who inspire and motivate others.',
    traits: ['Charismatic', 'Inspiring', 'Empathetic', 'Collaborative'],
  },
  green: {
    name: 'Green - The Analyst',
    color: '#22C55E',
    description: 'Detail-oriented professionals who value accuracy and systematic approaches.',
    traits: ['Analytical', 'Methodical', 'Detail-focused', 'Quality-driven'],
  },
  blue: {
    name: 'Blue - The Innovator',
    color: '#3B82F6',
    description: 'Creative visionaries who embrace change and innovative solutions.',
    traits: ['Creative', 'Innovative', 'Visionary', 'Adaptable'],
  },
};

const PREDEFINED_SKILLS = [
  'UI Design', 'Data Analysis', 'Coding', 'Writing', 'Research',
  'QA', 'Operations', 'Client Communication', 'Branding', 'Marketing',
  'Project Management', 'Sales', 'Strategy', 'Content Creation', 'Technical Support',
];

export default function UserProfileSheet({
  userId,
  companyId,
  open,
  onOpenChange,
  readOnly = false,
  onUserUpdate,
}: UserProfileSheetProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  
  // Editable fields
  const [jobDescription, setJobDescription] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (open && userId) {
      fetchUserProfile();
    }
  }, [open, userId]);

  const fetchUserProfile = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from('company_users')
        .select('*')
        .eq('id', userId)
        .eq('company_id', companyId)
        .single();

      if (userError) throw userError;

      setUser(userData);
      setJobDescription(userData.job_description || '');
      setSkills(userData.skills || []);

      // Fetch assessment results if available
      if (userData.assessment_result_id) {
        const { data: resultData, error: resultError } = await supabase
          .from('assessment_results')
          .select('results')
          .eq('id', userData.assessment_result_id)
          .single();

        if (!resultError && resultData) {
          const results = resultData.results as any;
          setAssessmentResult({
            dominantColor: results.dominantColor,
            scores: results.scores || { yellow: 0, red: 0, green: 0, blue: 0 },
            totalQuestions: results.totalQuestions || 0,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userId || readOnly) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('company_users')
        .update({
          job_description: jobDescription || null,
          skills: skills.length > 0 ? skills : null,
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Profile Updated',
        description: 'User profile has been saved successfully.',
      });

      onUserUpdate?.();
    } catch (error) {
      console.error('Error saving user profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save user profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'hr':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'partner':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      default:
        return '';
    }
  };

  if (!open) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Profile
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !user ? (
          <div className="text-center py-12 text-muted-foreground">
            User not found
          </div>
        ) : (
          <div className="space-y-6 py-6">
            {/* Profile Header */}
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                  {getInitials(user.full_name, user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold truncate">
                  {user.full_name || 'No name set'}
                </h3>
                <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {user.email}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant={user.role === 'employee' ? 'secondary' : 'default'}
                    className={getRoleBadgeColor(user.role)}
                  >
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                  {user.job_role && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {user.job_role}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="flex gap-4 text-sm text-muted-foreground">
              {user.invited_at && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Invited: {new Date(user.invited_at).toLocaleDateString()}
                </div>
              )}
              {user.joined_at && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Joined: {new Date(user.joined_at).toLocaleDateString()}
                </div>
              )}
            </div>

            <Separator />

            {/* Job Description */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Job Description
              </Label>
              {readOnly ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {jobDescription || 'No job description provided'}
                </p>
              ) : (
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Describe the role, responsibilities, and expectations..."
                  className="min-h-[100px] resize-none"
                />
              )}
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Skills
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                    {skill}
                    {!readOnly && (
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-1 hover:bg-muted rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
                {skills.length === 0 && (
                  <span className="text-sm text-muted-foreground">No skills assigned</span>
                )}
              </div>
              {!readOnly && (
                <>
                  <div className="flex gap-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a skill..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill(newSkill);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleAddSkill(newSkill)}
                      disabled={!newSkill.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {PREDEFINED_SKILLS.filter((s) => !skills.includes(s))
                      .slice(0, 8)
                      .map((skill) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10 text-xs"
                          onClick={() => handleAddSkill(skill)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {skill}
                        </Badge>
                      ))}
                  </div>
                </>
              )}
            </div>

            <Separator />

            {/* Role Color Report */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                RoleColor Report
              </Label>

              {user.assessment_completed_at && assessmentResult ? (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{
                          backgroundColor: COLOR_INFO[assessmentResult.dominantColor]?.color || '#888',
                        }}
                      />
                      {COLOR_INFO[assessmentResult.dominantColor]?.name || 'Unknown'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {COLOR_INFO[assessmentResult.dominantColor]?.description}
                    </p>

                    {/* Traits */}
                    <div className="flex flex-wrap gap-1.5">
                      {COLOR_INFO[assessmentResult.dominantColor]?.traits.map((trait) => (
                        <Badge
                          key={trait}
                          variant="secondary"
                          style={{
                            backgroundColor: `${COLOR_INFO[assessmentResult.dominantColor]?.color}20`,
                            color: COLOR_INFO[assessmentResult.dominantColor]?.color,
                            borderColor: `${COLOR_INFO[assessmentResult.dominantColor]?.color}40`,
                          }}
                        >
                          {trait}
                        </Badge>
                      ))}
                    </div>

                    {/* Score Breakdown */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Score Breakdown</p>
                      {Object.entries(assessmentResult.scores)
                        .sort(([, a], [, b]) => b - a)
                        .map(([color, score]) => {
                          const percentage =
                            assessmentResult.totalQuestions > 0
                              ? (score / assessmentResult.totalQuestions) * 100
                              : 0;
                          return (
                            <div key={color} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="capitalize">{color}</span>
                                <span>{Math.round(percentage)}%</span>
                              </div>
                              <Progress
                                value={percentage}
                                className="h-2"
                                style={
                                  {
                                    '--progress-color': COLOR_INFO[color]?.color || '#888',
                                  } as React.CSSProperties
                                }
                              />
                            </div>
                          );
                        })}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Completed: {new Date(user.assessment_completed_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ) : user.assessment_category ? (
                <Card className="border-dashed">
                  <CardContent className="py-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Assessment assigned ({user.assessment_category}) - pending completion
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-6 text-center">
                    <p className="text-sm text-muted-foreground">No assessment assigned yet</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Save Button */}
            {!readOnly && (
              <>
                <Separator />
                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
