import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Users, 
  Briefcase, 
  Lightbulb, 
  Crown, 
  Target,
  Trophy,
  ArrowRight 
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type AssessmentType = 'student' | 'teacher' | 'professional' | 'entrepreneur' | 'executive' | 'manager' | 'coach';

interface AssessmentOption {
  id: AssessmentType;
  title: string;
  description: string;
  icon: any;
  color: string;
  examples: string[];
}

const assessmentOptions: AssessmentOption[] = [
  {
    id: 'student',
    title: 'Student',
    description: 'For students in academic settings working on group projects and developing leadership skills',
    icon: GraduationCap,
    color: 'bg-blue-500',
    examples: ['High school students', 'College students', 'Graduate students']
  },
  {
    id: 'teacher',
    title: 'Teacher/Educator',
    description: 'For educators managing classrooms and developing teaching strategies',
    icon: Users,
    color: 'bg-green-500',
    examples: ['Teachers', 'Professors', 'Training coordinators']
  },
  {
    id: 'professional',
    title: 'Professional',
    description: 'For working professionals in various industries and career stages',
    icon: Briefcase,
    color: 'bg-purple-500',
    examples: ['Individual contributors', 'Team members', 'Specialists']
  },
  {
    id: 'entrepreneur',
    title: 'Entrepreneur',
    description: 'For founders and business owners building and scaling ventures',
    icon: Lightbulb,
    color: 'bg-orange-500',
    examples: ['Startup founders', 'Business owners', 'Innovators']
  },
  {
    id: 'executive',
    title: 'Executive',
    description: 'For senior leaders setting organizational strategy and vision',
    icon: Crown,
    color: 'bg-red-500',
    examples: ['C-suite executives', 'VPs', 'Senior directors']
  },
  {
    id: 'manager',
    title: 'Manager',
    description: 'For team leaders and people managers at all levels',
    icon: Target,
    color: 'bg-yellow-500',
    examples: ['Team leads', 'Department heads', 'Project managers']
  },
  {
    id: 'coach',
    title: 'Coach/Athlete',
    description: 'For coaches and athletes focused on team performance and leadership',
    icon: Trophy,
    color: 'bg-indigo-500',
    examples: ['Sports coaches', 'Team captains', 'Athletic leaders']
  }
];

const AssessmentSelection = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentType | null>(null);
  
  const assessmentType = searchParams.get('type') as 'premium' | 'pro';

  const handleContinue = () => {
    if (selectedAssessment) {
      // Navigate to the assessment with the selected type and audience
      navigate(`/${assessmentType}-assessment?audience=${selectedAssessment}`);
    }
  };

  if (!user || !assessmentType) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              Please complete your payment first to access this assessment.
            </p>
            <Button onClick={() => navigate('/pricing')}>
              Go to Pricing
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-wide py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="text-base px-6 py-3 mb-6 font-semibold">
              Assessment Selection
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Choose Your <span className="gradient-text-primary">Assessment Context</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Select the context that best describes your current role or situation. 
              This will customize the questions to be most relevant to your experience.
            </p>
            <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Note:</strong> All assessments measure the same core leadership qualities, 
                but questions are tailored to your specific context for maximum relevance.
              </p>
            </div>
          </div>

          {/* Assessment Options Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {assessmentOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedAssessment === option.id;
              
              return (
                <Card 
                  key={option.id}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                    isSelected 
                      ? 'border-primary shadow-md bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedAssessment(option.id)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg ${option.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <CardTitle className="text-lg">{option.title}</CardTitle>
                      {isSelected && (
                        <div className="ml-auto w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <ArrowRight className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {option.description}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Examples:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {option.examples.map((example, index) => (
                          <Badge 
                            key={index} 
                            variant="outline" 
                            className="text-xs"
                          >
                            {example}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Continue Button */}
          <div className="text-center">
            <Button 
              onClick={handleContinue}
              disabled={!selectedAssessment}
              size="lg"
              className="px-8 py-6 text-lg group"
            >
              Continue to Assessment
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            {!selectedAssessment && (
              <p className="text-sm text-muted-foreground mt-3">
                Please select an assessment context to continue
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentSelection;