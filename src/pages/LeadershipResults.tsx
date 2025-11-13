import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

type AssessmentType = "50q-teacher" | "50q-student" | "25q-teacher" | "25q-student";

const PLACEHOLDER_DATA = {
  primaryColor: "Blue",
  secondaryColor: "Green",
  score: 85,
  spectrumPosition: 65,
  leadershipStage: "Norming",
  categories: {
    "Decision-Making": 82,
    "Communication Style": 88,
    "Team Dynamics": 79,
    "Conflict Behavior": 75,
    "Motivation Drivers": 90,
    "Stress Behavior": 71,
    "Collaboration": 85,
    "Self-Management": 77,
  }
};

const TeacherReport50Q = () => (
  <div className="space-y-8">
    {/* Executive Summary */}
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">Executive Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Primary Leadership Color</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-500" />
              <div>
                <p className="text-2xl font-bold">{PLACEHOLDER_DATA.primaryColor}</p>
                <p className="text-sm text-muted-foreground">Score: {PLACEHOLDER_DATA.score}/100</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Secondary Color</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-500" />
              <p className="text-2xl font-bold">{PLACEHOLDER_DATA.secondaryColor}</p>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">Leadership Stage</h3>
          <Badge className="text-lg py-2 px-4">{PLACEHOLDER_DATA.leadershipStage}</Badge>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Spectrum Placement</h3>
          <div className="relative h-8 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-blue-500 rounded-full">
            <div 
              className="absolute w-4 h-4 bg-white border-4 border-foreground rounded-full top-1/2 -translate-y-1/2"
              style={{ left: `${PLACEHOLDER_DATA.spectrumPosition}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Full Color Profile */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Full Color Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">[Placeholder: Detailed description of the primary and secondary color characteristics, how they interact, and what this means for leadership style]</p>
      </CardContent>
    </Card>

    {/* Category Breakdown */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Detailed Category Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(PLACEHOLDER_DATA.categories).map(([category, score]) => (
          <div key={category}>
            <div className="flex justify-between mb-2">
              <h4 className="font-semibold">{category}</h4>
              <span className="text-sm text-muted-foreground">{score}/100</span>
            </div>
            <Progress value={score} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              [Placeholder: Detailed analysis of {category.toLowerCase()} with specific examples and insights]
            </p>
          </div>
        ))}
      </CardContent>
    </Card>

    {/* Leadership Stage Analysis */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Leadership Stage Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">[Placeholder: Deep dive into the {PLACEHOLDER_DATA.leadershipStage} stage and what it means for professional development]</p>
        <div className="space-y-2">
          <p className="text-sm"><strong>Current Stage:</strong> {PLACEHOLDER_DATA.leadershipStage}</p>
          <p className="text-sm text-muted-foreground">[Placeholder: Characteristics of this stage, typical behaviors, and growth opportunities]</p>
        </div>
      </CardContent>
    </Card>

    {/* Personalized Summary */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Personalized Leadership Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">[Placeholder Paragraph 1: AI-generated summary written in RCF voice, highlighting unique leadership strengths and patterns based on color profile and assessment responses]</p>
        <p className="text-muted-foreground">[Placeholder Paragraph 2: How this leadership style impacts team dynamics, decision-making, and collaboration in educational settings]</p>
        <p className="text-muted-foreground">[Placeholder Paragraph 3: Key insights about growth areas and how to leverage natural strengths for maximum impact]</p>
      </CardContent>
    </Card>

    {/* Growth Plan */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Professional Growth Plan</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span className="text-muted-foreground">[Placeholder: Specific action item 1 for professional development]</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span className="text-muted-foreground">[Placeholder: Specific action item 2 focusing on leadership strengths]</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span className="text-muted-foreground">[Placeholder: Specific action item 3 for team collaboration]</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span className="text-muted-foreground">[Placeholder: Specific action item 4 for classroom/school impact]</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span className="text-muted-foreground">[Placeholder: Specific action item 5 for continuous improvement]</span>
          </li>
        </ul>
      </CardContent>
    </Card>

    {/* Team Fit Map */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Team Fit & Collaboration Map</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-square max-w-md mx-auto bg-muted rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground text-center p-8">[Placeholder: Heat-map or quadrant visualization showing collaboration strengths and team fit dynamics]</p>
        </div>
      </CardContent>
    </Card>
  </div>
);

const StudentReport50Q = () => (
  <div className="space-y-8">
    {/* Summary */}
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">Your Leadership Colors</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Primary Color</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-500" />
              <div>
                <p className="text-2xl font-bold">{PLACEHOLDER_DATA.primaryColor}</p>
                <p className="text-sm text-muted-foreground">Score: {PLACEHOLDER_DATA.score}/100</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Secondary Color</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-500" />
              <p className="text-2xl font-bold">{PLACEHOLDER_DATA.secondaryColor}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Leadership Spectrum</h3>
          <div className="relative h-8 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-blue-500 rounded-full">
            <div 
              className="absolute w-4 h-4 bg-white border-4 border-foreground rounded-full top-1/2 -translate-y-1/2"
              style={{ left: `${PLACEHOLDER_DATA.spectrumPosition}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Color Profile for Group Work */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Your Color in Group Projects</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">[Placeholder: Friendly explanation of how your colors show up in group work, clubs, and team activities]</p>
      </CardContent>
    </Card>

    {/* Category Breakdown */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Your Leadership Strengths</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(PLACEHOLDER_DATA.categories).map(([category, score]) => (
          <div key={category}>
            <div className="flex justify-between mb-2">
              <h4 className="font-semibold">{category}</h4>
              <span className="text-sm text-muted-foreground">{score}/100</span>
            </div>
            <Progress value={score} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              [Placeholder: Student-friendly explanation of {category.toLowerCase()}]
            </p>
          </div>
        ))}
      </CardContent>
    </Card>

    {/* Leadership Stage */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Your Leadership Level</CardTitle>
      </CardHeader>
      <CardContent>
        <Badge className="text-lg py-2 px-4 mb-4">{PLACEHOLDER_DATA.leadershipStage}</Badge>
        <p className="text-muted-foreground">[Placeholder: What this stage means for students, with examples from school, sports, and clubs]</p>
      </CardContent>
    </Card>

    {/* Personalized Summary */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">What Makes You Unique</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">[Placeholder Paragraph 1: Encouraging summary of leadership style in student-friendly language]</p>
        <p className="text-muted-foreground">[Placeholder Paragraph 2: How to use these strengths in school and activities]</p>
      </CardContent>
    </Card>

    {/* Growth Plan */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Ways to Grow as a Leader</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span className="text-muted-foreground">[Placeholder: Growth action for school]</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span className="text-muted-foreground">[Placeholder: Growth action for clubs/activities]</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span className="text-muted-foreground">[Placeholder: Growth action for sports/teams]</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span className="text-muted-foreground">[Placeholder: Growth action for friendships]</span>
          </li>
        </ul>
      </CardContent>
    </Card>

    {/* Team Fit */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">How You Work with Others</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-square max-w-md mx-auto bg-muted rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground text-center p-8">[Placeholder: Simple visualization showing team dynamics and collaboration style]</p>
        </div>
      </CardContent>
    </Card>
  </div>
);

const TeacherReport25Q = () => (
  <div className="space-y-8">
    {/* Summary */}
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">Leadership Color Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Primary Color</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-500" />
              <div>
                <p className="text-2xl font-bold">{PLACEHOLDER_DATA.primaryColor}</p>
                <p className="text-sm text-muted-foreground">Score: {PLACEHOLDER_DATA.score}/100</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Leadership Stage</h3>
            <Badge className="text-lg py-2 px-4">{PLACEHOLDER_DATA.leadershipStage}</Badge>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Spectrum Position</h3>
          <div className="relative h-8 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-blue-500 rounded-full">
            <div 
              className="absolute w-4 h-4 bg-white border-4 border-foreground rounded-full top-1/2 -translate-y-1/2"
              style={{ left: `${PLACEHOLDER_DATA.spectrumPosition}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Short-form Color Profile */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Your Color Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">[Placeholder: Concise overview of primary color characteristics and leadership approach]</p>
      </CardContent>
    </Card>

    {/* Condensed Category Breakdown */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Key Leadership Areas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {["Decision-Making", "Communication Style", "Team Dynamics", "Conflict Behavior", "Motivation Drivers"].map((category) => (
          <div key={category}>
            <div className="flex justify-between mb-2">
              <h4 className="font-semibold">{category}</h4>
              <span className="text-sm text-muted-foreground">{PLACEHOLDER_DATA.categories[category as keyof typeof PLACEHOLDER_DATA.categories]}/100</span>
            </div>
            <Progress value={PLACEHOLDER_DATA.categories[category as keyof typeof PLACEHOLDER_DATA.categories]} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              [Placeholder: Brief insight about {category.toLowerCase()}]
            </p>
          </div>
        ))}
      </CardContent>
    </Card>

    {/* Personalized Summary */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">[Placeholder Paragraph 1: Brief AI-generated summary in professional tone]</p>
        <p className="text-muted-foreground">[Placeholder Paragraph 2: Key takeaways for school context]</p>
      </CardContent>
    </Card>

    {/* School-context Growth Plan */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">School Context Growth Plan</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span className="text-muted-foreground">[Placeholder: Action for classroom leadership]</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span className="text-muted-foreground">[Placeholder: Action for staff collaboration]</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span className="text-muted-foreground">[Placeholder: Action for student engagement]</span>
          </li>
        </ul>
      </CardContent>
    </Card>
  </div>
);

const StudentReport25Q = () => (
  <div className="space-y-8">
    {/* Leadership Color */}
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">Your Leadership Color</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-blue-500" />
          <div>
            <p className="text-3xl font-bold">{PLACEHOLDER_DATA.primaryColor}</p>
            <p className="text-muted-foreground">Score: {PLACEHOLDER_DATA.score}/100</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Your Leadership Style</h3>
          <div className="relative h-8 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-blue-500 rounded-full">
            <div 
              className="absolute w-4 h-4 bg-white border-4 border-foreground rounded-full top-1/2 -translate-y-1/2"
              style={{ left: `${PLACEHOLDER_DATA.spectrumPosition}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Strength Snapshot */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Your Top Strengths</CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">💪 Strength 1</h4>
          <p className="text-sm text-muted-foreground">[Placeholder: First key strength]</p>
        </div>
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">🎯 Strength 2</h4>
          <p className="text-sm text-muted-foreground">[Placeholder: Second key strength]</p>
        </div>
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">⭐ Strength 3</h4>
          <p className="text-sm text-muted-foreground">[Placeholder: Third key strength]</p>
        </div>
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">🚀 Strength 4</h4>
          <p className="text-sm text-muted-foreground">[Placeholder: Fourth key strength]</p>
        </div>
      </CardContent>
    </Card>

    {/* Group-work Behavior */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">How You Lead in Groups</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">[Placeholder: Fun, motivating description of group work style]</p>
        <div className="space-y-2">
          <p className="text-sm"><strong>In class projects:</strong> [Placeholder behavior]</p>
          <p className="text-sm"><strong>In sports/activities:</strong> [Placeholder behavior]</p>
          <p className="text-sm"><strong>With friends:</strong> [Placeholder behavior]</p>
        </div>
      </CardContent>
    </Card>

    {/* Mini Growth Plan */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Quick Growth Tips</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-semibold mb-1">This week, try:</p>
            <p className="text-sm">[Placeholder: One actionable tip]</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-semibold mb-1">This month, focus on:</p>
            <p className="text-sm">[Placeholder: One growth focus]</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-semibold mb-1">Dream big:</p>
            <p className="text-sm">[Placeholder: One inspiring vision]</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const LeadershipResults = () => {
  const { type } = useParams<{ type: AssessmentType }>();
  const navigate = useNavigate();

  const getReportTitle = () => {
    switch (type) {
      case "50q-teacher":
        return "50-Question Teacher Assessment Report";
      case "50q-student":
        return "50-Question Student Assessment Report";
      case "25q-teacher":
        return "25-Question Teacher Assessment Report";
      case "25q-student":
        return "25-Question Student Assessment Report";
      default:
        return "Assessment Report";
    }
  };

  const getReportComponent = () => {
    switch (type) {
      case "50q-teacher":
        return <TeacherReport50Q />;
      case "50q-student":
        return <StudentReport50Q />;
      case "25q-teacher":
        return <TeacherReport25Q />;
      case "25q-student":
        return <StudentReport25Q />;
      default:
        return <div>Invalid assessment type</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-end mb-4">
          <Button variant="ghost" onClick={() => navigate("/leadership-assessment")} className="gap-2">
            <Home className="h-4 w-4" />
            Back to Assessment
          </Button>
        </div>
        
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text-primary">Your Leadership</span> Assessment Results
          </h1>
          <p className="text-xl text-muted-foreground">{getReportTitle()}</p>
        </div>

        {getReportComponent()}
      </div>
    </div>
  );
};

export default LeadershipResults;
