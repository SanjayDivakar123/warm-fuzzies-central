import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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
        <p className="text-muted-foreground mb-4">[Placeholder: Deep dive into the {PLACEHOLDER_DATA.leadershipStage} stage characteristics, typical behaviors, team impact, and development opportunities]</p>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div>
            <h4 className="font-semibold mb-2">Strengths at This Stage</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>[Placeholder strength 1]</li>
              <li>[Placeholder strength 2]</li>
              <li>[Placeholder strength 3]</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Growth Opportunities</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>[Placeholder opportunity 1]</li>
              <li>[Placeholder opportunity 2]</li>
              <li>[Placeholder opportunity 3]</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Personalized Summary */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Personalized Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          [Placeholder: AI-generated paragraph 1 - Introduction to the individual's unique leadership profile in the RCF voice]
        </p>
        <p className="text-muted-foreground">
          [Placeholder: AI-generated paragraph 2 - Specific insights about their color combination and what makes their approach distinctive]
        </p>
        <p className="text-muted-foreground">
          [Placeholder: AI-generated paragraph 3 - Forward-looking perspective on their leadership potential and development path]
        </p>
      </CardContent>
    </Card>

    {/* Growth Plan */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">One-Page Growth Plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Immediate Actions (Next 30 Days)</h4>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>[Placeholder: Specific action item 1]</li>
            <li>[Placeholder: Specific action item 2]</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Medium-Term Goals (3-6 Months)</h4>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>[Placeholder: Development goal 1]</li>
            <li>[Placeholder: Development goal 2]</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Long-Term Development (6-12 Months)</h4>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>[Placeholder: Strategic objective 1]</li>
          </ul>
        </div>
      </CardContent>
    </Card>

    {/* Team Fit Map */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Team Fit & Collaboration Map</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 h-64">
          <div className="border-2 border-dashed rounded-lg p-4 flex items-center justify-center">
            <p className="text-center text-muted-foreground">[Quadrant 1: Placeholder]</p>
          </div>
          <div className="border-2 border-dashed rounded-lg p-4 flex items-center justify-center">
            <p className="text-center text-muted-foreground">[Quadrant 2: Placeholder]</p>
          </div>
          <div className="border-2 border-dashed rounded-lg p-4 flex items-center justify-center">
            <p className="text-center text-muted-foreground">[Quadrant 3: Placeholder]</p>
          </div>
          <div className="border-2 border-dashed rounded-lg p-4 flex items-center justify-center">
            <p className="text-center text-muted-foreground">[Quadrant 4: Placeholder]</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          [Placeholder: Explanation of heat-map/quadrant visualization and what it means for team collaboration]
        </p>
      </CardContent>
    </Card>
  </div>
);

const StudentReport50Q = () => (
  <div className="space-y-8">
    {/* Summary */}
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">Your Leadership Color Profile</CardTitle>
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
          <h3 className="font-semibold mb-2">Your Leadership Stage</h3>
          <Badge className="text-lg py-2 px-4">{PLACEHOLDER_DATA.leadershipStage}</Badge>
          <p className="text-sm text-muted-foreground mt-2">
            [Placeholder: Student-friendly explanation of what this stage means]
          </p>
        </div>
      </CardContent>
    </Card>

    {/* Color Profile for Group Work */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">How You Work in Groups</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          [Placeholder: Friendly explanation of how their color profile shows up in group projects, clubs, and team activities]
        </p>
      </CardContent>
    </Card>

    {/* Category Breakdown */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Your Strengths & Style</CardTitle>
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

    {/* Personalized Summary */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">What This Means for You</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          [Placeholder: AI-generated summary paragraph 1 - Direct, friendly tone]
        </p>
        <p className="text-muted-foreground">
          [Placeholder: AI-generated summary paragraph 2 - Encouraging and motivating]
        </p>
      </CardContent>
    </Card>

    {/* Growth Plan */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Your Growth Plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <h4 className="font-semibold mb-2">Try This Week</h4>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>[Placeholder: Simple, actionable item for school/clubs]</li>
            <li>[Placeholder: Simple, actionable item for sports/activities]</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">This Month's Challenge</h4>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>[Placeholder: Slightly bigger goal]</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Your Big Goal</h4>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>[Placeholder: Inspiring long-term objective]</li>
          </ul>
        </div>
      </CardContent>
    </Card>

    {/* Team Fit Map */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Best Team Roles for You</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 h-48">
          <div className="border-2 border-dashed rounded-lg p-4 flex items-center justify-center">
            <p className="text-center text-sm text-muted-foreground">[Role Type 1]</p>
          </div>
          <div className="border-2 border-dashed rounded-lg p-4 flex items-center justify-center">
            <p className="text-center text-sm text-muted-foreground">[Role Type 2]</p>
          </div>
          <div className="border-2 border-dashed rounded-lg p-4 flex items-center justify-center">
            <p className="text-center text-sm text-muted-foreground">[Role Type 3]</p>
          </div>
          <div className="border-2 border-dashed rounded-lg p-4 flex items-center justify-center">
            <p className="text-center text-sm text-muted-foreground">[Role Type 4]</p>
          </div>
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
      </CardContent>
    </Card>

    {/* Short-Form Color Profile */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Your Leadership Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          [Placeholder: Brief but professional summary of color profile and what it means for classroom leadership]
        </p>
      </CardContent>
    </Card>

    {/* Condensed Categories */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Key Category Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {["Decision-Making", "Communication Style", "Team Dynamics", "Motivation Drivers", "Collaboration"].map((category) => {
          const score = PLACEHOLDER_DATA.categories[category as keyof typeof PLACEHOLDER_DATA.categories];
          return (
            <div key={category}>
              <div className="flex justify-between mb-2">
                <h4 className="font-semibold">{category}</h4>
                <span className="text-sm text-muted-foreground">{score}/100</span>
              </div>
              <Progress value={score} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                [Placeholder: Brief insight about {category.toLowerCase()}]
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>

    {/* Personalized Summary */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Personalized Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          [Placeholder: AI-generated concise summary in RCF voice]
        </p>
      </CardContent>
    </Card>

    {/* School-Context Growth Plan */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">School-Context Growth Plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="list-disc list-inside text-muted-foreground space-y-2">
          <li>[Placeholder: Classroom-specific action 1]</li>
          <li>[Placeholder: Classroom-specific action 2]</li>
          <li>[Placeholder: Team collaboration action]</li>
          <li>[Placeholder: Professional development suggestion]</li>
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
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-blue-500" />
          <div>
            <p className="text-3xl font-bold">{PLACEHOLDER_DATA.primaryColor}</p>
            <p className="text-muted-foreground">with {PLACEHOLDER_DATA.secondaryColor} energy</p>
            <p className="text-sm text-muted-foreground mt-1">Score: {PLACEHOLDER_DATA.score}/100</p>
          </div>
        </div>
        <p className="text-muted-foreground">
          [Placeholder: Fun, encouraging explanation of what this color combo means]
        </p>
      </CardContent>
    </Card>

    {/* Strength Snapshot */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Your Superpowers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-accent/50">
            <h4 className="font-semibold mb-1">✨ Top Strength 1</h4>
            <p className="text-sm text-muted-foreground">[Placeholder description]</p>
          </div>
          <div className="p-4 rounded-lg bg-accent/50">
            <h4 className="font-semibold mb-1">🎯 Top Strength 2</h4>
            <p className="text-sm text-muted-foreground">[Placeholder description]</p>
          </div>
          <div className="p-4 rounded-lg bg-accent/50">
            <h4 className="font-semibold mb-1">🚀 Top Strength 3</h4>
            <p className="text-sm text-muted-foreground">[Placeholder description]</p>
          </div>
          <div className="p-4 rounded-lg bg-accent/50">
            <h4 className="font-semibold mb-1">💪 Top Strength 4</h4>
            <p className="text-sm text-muted-foreground">[Placeholder description]</p>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Group-Work Behavior */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">How You Show Up in Groups</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <h4 className="font-semibold mb-2">In Class Projects</h4>
          <p className="text-sm text-muted-foreground">[Placeholder: What role you naturally take]</p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">In Sports & Activities</h4>
          <p className="text-sm text-muted-foreground">[Placeholder: Your team contribution style]</p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">With Friends</h4>
          <p className="text-sm text-muted-foreground">[Placeholder: Your social leadership style]</p>
        </div>
      </CardContent>
    </Card>

    {/* Mini Growth Plan */}
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Your Next Steps</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-4 rounded-lg bg-primary/10 border-l-4 border-primary">
          <h4 className="font-semibold mb-1">🎯 This Week</h4>
          <p className="text-sm">[Placeholder: One simple challenge]</p>
        </div>
        <div className="p-4 rounded-lg bg-primary/10 border-l-4 border-primary">
          <h4 className="font-semibold mb-1">🌟 This Month</h4>
          <p className="text-sm">[Placeholder: One exciting goal]</p>
        </div>
        <div className="p-4 rounded-lg bg-primary/10 border-l-4 border-primary">
          <h4 className="font-semibold mb-1">🚀 Your Big Dream</h4>
          <p className="text-sm">[Placeholder: One inspiring vision]</p>
        </div>
      </CardContent>
    </Card>
  </div>
);

const LeadershipResults = () => {
  const { type } = useParams<{ type: AssessmentType }>();

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
