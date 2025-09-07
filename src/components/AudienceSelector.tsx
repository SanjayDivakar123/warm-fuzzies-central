import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Lightbulb, 
  Briefcase 
} from "lucide-react";

export type AudienceType = 'student' | 'school-leader' | 'teacher' | 'entrepreneur' | 'professional';

interface AudienceSelectorProps {
  onAudienceSelect: (audience: AudienceType) => void;
}

export default function AudienceSelector({ onAudienceSelect }: AudienceSelectorProps) {
  const [selectedAudience, setSelectedAudience] = useState<AudienceType | null>(null);

  const audiences = [
    {
      type: 'student' as AudienceType,
      title: 'Student',
      description: 'Questions about classmates, projects, and group work',
      icon: GraduationCap,
      color: 'bg-blue text-blue-foreground'
    },
    {
      type: 'school-leader' as AudienceType,
      title: 'School Leader',
      description: 'Questions about staff, initiatives, and departments',
      icon: Users,
      color: 'bg-red text-red-foreground'
    },
    {
      type: 'teacher' as AudienceType,
      title: 'Teacher',
      description: 'Questions about classrooms, lesson planning, and curriculum teams',
      icon: BookOpen,
      color: 'bg-green text-green-foreground'
    },
    {
      type: 'entrepreneur' as AudienceType,
      title: 'Entrepreneur',
      description: 'Questions about startups, business growth, and customers',
      icon: Lightbulb,
      color: 'bg-yellow text-yellow-foreground'
    },
    {
      type: 'professional' as AudienceType,
      title: 'Professional',
      description: 'Questions about workplace, colleagues, and cross-functional teams',
      icon: Briefcase,
      color: 'bg-primary text-primary-foreground'
    }
  ];

  const handleContinue = () => {
    if (selectedAudience) {
      onAudienceSelect(selectedAudience);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center">
      <Card className="w-full max-w-4xl mx-4 glass-card">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl mb-4">
            Personalize Your RoleColor™ Test
          </CardTitle>
          <p className="text-muted-foreground">
            Tell us who you are so we can tailor the questions to your context.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {audiences.map((audience) => {
              const Icon = audience.icon;
              const isSelected = selectedAudience === audience.type;
              
              return (
                <Card 
                  key={audience.type}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-elegant ${
                    isSelected ? 'ring-2 ring-primary shadow-glow' : ''
                  }`}
                  onClick={() => setSelectedAudience(audience.type)}
                >
                  <CardContent className="p-6 text-center">
                    <Icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="font-semibold mb-2">{audience.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {audience.description}
                    </p>
                    {isSelected && (
                      <Badge className={`mt-3 ${audience.color}`}>
                        Selected
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="text-center">
            <Button 
              size="lg" 
              onClick={handleContinue}
              disabled={!selectedAudience}
              className="px-8"
            >
              Continue to Test
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}