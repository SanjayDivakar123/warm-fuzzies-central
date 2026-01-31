import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, Copy, Share2, ArrowRight, Sparkles, User, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/navigation/Navbar";
import { useToast } from "@/hooks/use-toast";

interface CelebrityResults {
  celebrityName: string;
  dominantColor: string;
  secondaryColor: string;
  scores: { yellow: number; red: number; green: number; blue: number };
  totalQuestions: number;
  timestamp: string;
}

const colorData: Record<string, {
  name: string;
  emoji: string;
  description: string;
  traits: string[];
  strengths: string[];
  challenges: string[];
  famousExamples: string[];
  gradient: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}> = {
  yellow: {
    name: "Fast Executor",
    emoji: "⚡",
    description: "A natural action-taker who thrives on getting things done quickly and efficiently. This leader drives results through decisive action and unwavering focus on goals.",
    traits: ["Decisive", "Results-driven", "Action-oriented", "Competitive"],
    strengths: ["Quick decision-making", "Strong execution", "Goal achievement", "Crisis leadership"],
    challenges: ["May overlook details", "Can be impatient with process", "Risk of burnout"],
    famousExamples: ["Elon Musk", "Gordon Ramsay", "Serena Williams", "Steve Jobs"],
    gradient: "bg-gradient-to-br from-yellow-400 to-amber-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    textColor: "text-yellow-700 dark:text-yellow-400",
    borderColor: "border-yellow-500/30",
  },
  red: {
    name: "Creative Motivator",
    emoji: "🔥",
    description: "An inspiring visionary who energizes others with innovative ideas and passionate leadership. This leader creates excitement and drives change through enthusiasm.",
    traits: ["Charismatic", "Innovative", "Enthusiastic", "Visionary"],
    strengths: ["Inspirational leadership", "Creative problem-solving", "Team motivation", "Vision casting"],
    challenges: ["May struggle with follow-through", "Can overlook practicalities", "Risk of overcommitment"],
    famousExamples: ["Oprah Winfrey", "Richard Branson", "Tony Stark (Iron Man)", "Will Smith"],
    gradient: "bg-gradient-to-br from-red-400 to-rose-500",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    textColor: "text-red-700 dark:text-red-400",
    borderColor: "border-red-500/30",
  },
  green: {
    name: "Logical Systems Thinker",
    emoji: "🧠",
    description: "A methodical strategist who excels at building systems and processes. This leader brings order and optimization through careful analysis and structured thinking.",
    traits: ["Analytical", "Systematic", "Methodical", "Detail-oriented"],
    strengths: ["Strategic planning", "Systems thinking", "Process optimization", "Risk management"],
    challenges: ["May over-analyze", "Can be slow to decide", "Risk of analysis paralysis"],
    famousExamples: ["Bill Gates", "Sherlock Holmes", "Warren Buffett", "Spock (Star Trek)"],
    gradient: "bg-gradient-to-br from-green-400 to-emerald-500",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    textColor: "text-green-700 dark:text-green-400",
    borderColor: "border-green-500/30",
  },
  blue: {
    name: "Empathetic Connector",
    emoji: "💙",
    description: "A natural relationship builder who creates harmony and brings out the best in people. This leader fosters trust and collaboration through genuine care.",
    traits: ["Empathetic", "Supportive", "Collaborative", "Intuitive"],
    strengths: ["Team building", "Emotional intelligence", "Conflict resolution", "Culture creation"],
    challenges: ["May avoid conflict", "Can be too accommodating", "Risk of people-pleasing"],
    famousExamples: ["Princess Diana", "Mr. Rogers", "Keanu Reeves", "Ted Lasso"],
    gradient: "bg-gradient-to-br from-blue-400 to-indigo-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    textColor: "text-blue-700 dark:text-blue-400",
    borderColor: "border-blue-500/30",
  },
};

const CelebrityResults = () => {
  const [results, setResults] = useState<CelebrityResults | null>(null);
  const resultCardRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const storedResults = localStorage.getItem('celebrityAssessmentResults');
    if (storedResults) {
      setResults(JSON.parse(storedResults));
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handleCopyResults = () => {
    if (!results) return;
    
    const colorInfo = colorData[results.dominantColor];
    const text = `🌟 ${results.celebrityName}'s RoleColor™ Profile 🌟

${colorInfo.emoji} Dominant Color: ${colorInfo.name} (${results.dominantColor.toUpperCase()})
${colorData[results.secondaryColor].emoji} Secondary Color: ${colorData[results.secondaryColor].name} (${results.secondaryColor.toUpperCase()})

📊 Color Scores:
• Yellow: ${results.scores.yellow}/${results.totalQuestions}
• Red: ${results.scores.red}/${results.totalQuestions}
• Green: ${results.scores.green}/${results.totalQuestions}
• Blue: ${results.scores.blue}/${results.totalQuestions}

💡 About ${results.celebrityName}:
${colorInfo.description}

✨ Key Traits: ${colorInfo.traits.join(", ")}

🎯 Strengths: ${colorInfo.strengths.join(", ")}

📈 Growth Areas: ${colorInfo.challenges.join(", ")}

Similar to: ${colorInfo.famousExamples.join(", ")}

---
Discover your own RoleColor™ at rolecolorfinder.com`;

    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Results copied to clipboard",
    });
  };

  if (!results) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const dominantColorInfo = colorData[results.dominantColor];
  const secondaryColorInfo = colorData[results.secondaryColor];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 px-4 py-2">
            <Star className="w-4 h-4 mr-2" />
            Celebrity RoleColor™ Profile
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            <span className={dominantColorInfo.textColor}>{results.celebrityName}</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            is a <span className={`font-bold ${dominantColorInfo.textColor}`}>{dominantColorInfo.name}</span>
          </p>
        </div>

        {/* Main Result Card */}
        <Card ref={resultCardRef} className={`mb-8 border-2 ${dominantColorInfo.borderColor} shadow-2xl overflow-hidden`}>
          <div className={`${dominantColorInfo.gradient} p-8 text-white text-center`}>
            <div className="text-6xl mb-4">{dominantColorInfo.emoji}</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">{dominantColorInfo.name}</h2>
            <p className="text-white/90 text-lg">Dominant Leadership Style</p>
          </div>
          <CardContent className="p-8">
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              {dominantColorInfo.description.replace("This leader", results.celebrityName)}
            </p>

            {/* Traits */}
            <div className="mb-8">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Key Traits
              </h3>
              <div className="flex flex-wrap gap-2">
                {dominantColorInfo.traits.map((trait, i) => (
                  <Badge key={i} variant="secondary" className="px-4 py-2 text-base">
                    {trait}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Strengths */}
            <div className="mb-8">
              <h3 className="font-bold text-lg mb-4">💪 {results.celebrityName}'s Strengths</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {dominantColorInfo.strengths.map((strength, i) => (
                  <div key={i} className={`p-4 rounded-xl ${dominantColorInfo.bgColor} border ${dominantColorInfo.borderColor}`}>
                    <span className={dominantColorInfo.textColor}>✓</span> {strength}
                  </div>
                ))}
              </div>
            </div>

            {/* Growth Areas */}
            <div className="mb-8">
              <h3 className="font-bold text-lg mb-4">📈 Growth Opportunities</h3>
              <div className="grid sm:grid-cols-3 gap-3">
                {dominantColorInfo.challenges.map((challenge, i) => (
                  <div key={i} className="p-4 rounded-xl bg-muted/50 border border-border text-sm">
                    {challenge}
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-8" />

            {/* Secondary Color */}
            <div className={`p-6 rounded-2xl ${secondaryColorInfo.bgColor} border ${secondaryColorInfo.borderColor}`}>
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                {secondaryColorInfo.emoji} Secondary Style: {secondaryColorInfo.name}
              </h3>
              <p className="text-muted-foreground">
                {results.celebrityName} also shows strong {secondaryColorInfo.name.toLowerCase()} tendencies, 
                bringing {secondaryColorInfo.traits.slice(0, 2).join(" and ").toLowerCase()} qualities to their leadership approach.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Color Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Color Score Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(results.scores).map(([color, score]) => {
                const info = colorData[color];
                const percentage = Math.round((score / results.totalQuestions) * 100);
                return (
                  <div key={color} className={`p-4 rounded-xl text-center ${info.bgColor} border ${info.borderColor}`}>
                    <div className="text-2xl mb-2">{info.emoji}</div>
                    <div className={`text-2xl font-bold ${info.textColor}`}>{percentage}%</div>
                    <div className="text-sm text-muted-foreground">{info.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{score}/{results.totalQuestions}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Similar Figures */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Similar Leadership Styles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {results.celebrityName} shares leadership qualities with:
            </p>
            <div className="flex flex-wrap gap-3">
              {dominantColorInfo.famousExamples.map((example, i) => (
                <Badge key={i} variant="outline" className={`px-4 py-2 text-base ${dominantColorInfo.borderColor} ${dominantColorInfo.textColor}`}>
                  {example}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center mb-12">
          <Button onClick={handleCopyResults} variant="outline" className="gap-2">
            <Copy className="w-4 h-4" />
            Copy Results
          </Button>
          <Button onClick={() => navigate('/')} className="gap-2">
            Try Another Character
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* CTA */}
        <Card className="bg-gradient-to-br from-primary/10 via-green/10 to-blue/10 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Discover Your Own RoleColor™</h3>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Now that you've analyzed {results.celebrityName}, find out your own leadership color profile!
            </p>
            <Link to="/free-assessment">
              <Button size="lg" className="gap-2">
                Take Your Free Assessment
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CelebrityResults;
