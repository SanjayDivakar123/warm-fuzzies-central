import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navigation/Navbar";
import { Logos3 } from "@/components/ui/logos3";
import { Share2, FileText, Users, Zap, Brain, Target, AlertTriangle, MessageSquare, TrendingUp, CheckCircle, XCircle, Lightbulb } from "lucide-react";
import { exportProfessional50QPDF } from "@/lib/professional50QPdfExport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SendToFriendCard from "@/components/reports/SendToFriendCard";
import RoleColorIdentityCard from "@/components/reports/RoleColorIdentityCard";

interface Results {
  dominantColor: string;
  scores: {
    yellow: number;
    red: number;
    green: number;
    blue: number;
  };
  totalQuestions: number;
  assessmentType: string;
}

const COLOR_PROFILES = {
  yellow: {
    name: "Yellow",
    title: "Action-Oriented Executor",
    subtitle: "The Results Driver",
    overview: "Yellow leaders are the engines of execution. They thrive on momentum, decisiveness, and tangible outcomes. When a Yellow sees a goal, they immediately begin calculating the fastest path to achievement. They are not paralyzed by analysis—they act. This makes them invaluable in high-pressure environments where speed and decisiveness are essential.",
    coreStrengths: [
      "Rapid decision-making under pressure",
      "Exceptional goal achievement and follow-through",
      "Natural ability to prioritize effectively",
      "Strong execution discipline",
      "Results-oriented mindset that drives productivity"
    ],
    stressBehaviors: [
      "May become impatient with slower-paced team members",
      "Can appear dismissive of process when focused on outcomes",
      "Tendency to take over tasks rather than delegate",
      "May sacrifice relationship-building for efficiency",
      "Can become frustrated when progress stalls"
    ],
    misinterpretations: [
      "Often mistaken for being uncaring (they care deeply about results)",
      "Perceived as controlling when they're actually trying to help",
      "Seen as impatient when they're simply action-oriented",
      "Viewed as dismissive when focused on priorities",
      "Misread as cold when being efficient"
    ],
    growthEdges: [
      "Developing patience with collaborative processes",
      "Learning to value the journey, not just the destination",
      "Building stronger emotional connections with team members",
      "Embracing strategic pauses for reflection",
      "Cultivating appreciation for diverse working styles"
    ],
    languageResponds: [
      "\"What's the fastest way to get this done?\"",
      "\"Let's set clear targets and metrics\"",
      "\"What are the action items?\"",
      "\"Let's eliminate the bottlenecks\"",
      "\"Show me the results\""
    ],
    leadershipStyle: "Yellow leaders lead from the front. They set the pace, establish clear expectations, and hold themselves and others accountable for results. Their leadership is characterized by clarity of direction, efficient use of resources, and an unwavering focus on achievement. They inspire through action and results rather than words.",
    inTeams: "In team settings, Yellows naturally gravitate toward project management and execution roles. They keep meetings on track, ensure deadlines are met, and hold the team accountable. They excel at breaking down large goals into actionable steps and tracking progress. However, they may need to consciously slow down to include quieter team members.",
    inConflict: "Yellows approach conflict directly and seek rapid resolution. They prefer to address issues head-on rather than let them fester. Their conflict style is solution-focused: identify the problem, determine the fix, implement, move on. They may need to develop more patience for processing emotions during conflict.",
    inLeadership: "As formal leaders, Yellows excel at setting direction, maintaining momentum, and achieving organizational goals. They are often promoted quickly due to their visible results. Their challenge is learning to inspire and develop others, not just drive them.",
    inLearning: "Yellows learn best through practical application. They prefer hands-on experiences, case studies with clear outcomes, and training that can be immediately applied. Theoretical discussions frustrate them unless connected to actionable takeaways.",
    inHighStakes: "High-pressure situations are where Yellows shine brightest. Their decisiveness and action-orientation make them invaluable in crisis situations. They remain calm, focused, and solution-oriented when others may freeze.",
    withOpposites: "Yellows work best with Blues (creative thinkers) when they value the Blue's innovative ideas and the Blue appreciates the Yellow's execution ability. The Yellow-Green pairing can be powerful when the Green provides systems and the Yellow drives implementation.",
    needsFromOthers: [
      "Clear communication without excessive preamble",
      "Respect for their time and efficiency",
      "Follow-through on commitments",
      "Autonomy to execute once direction is set",
      "Recognition for results achieved"
    ],
    othersNeedFromThem: [
      "Patience during collaborative processes",
      "Recognition of effort, not just outcomes",
      "Space for creative exploration",
      "Acknowledgment of different working styles",
      "Celebration of progress, not just completion"
    ],
    developmentStrategies: [
      "Practice active listening without immediately jumping to solutions",
      "Schedule regular one-on-ones focused on relationship building",
      "Celebrate process milestones, not just final results",
      "Seek feedback on your pace and its impact on others",
      "Develop mentoring relationships to build patience"
    ],
    doList: [
      "Set clear, measurable goals for yourself and your team",
      "Break large projects into daily actionable steps",
      "Communicate your priorities clearly and often",
      "Build in regular check-ins to ensure alignment",
      "Recognize and reward team members' contributions"
    ],
    dontList: [
      "Don't dismiss ideas without giving them fair consideration",
      "Don't sacrifice relationships for short-term efficiency",
      "Don't take over tasks from capable team members",
      "Don't skip the planning phase to start executing",
      "Don't ignore the emotional needs of your team"
    ],
    reflectionQuestions: [
      "When was the last time I slowed down to really listen to a team member?",
      "How might my pace be affecting others around me?",
      "What would happen if I took more time for strategic thinking?",
      "Who on my team might benefit from more recognition?",
      "How can I better balance results with relationships?"
    ],
    colorHex: "#EAB308",
    bgClass: "bg-yellow-500",
    textClass: "text-yellow-600",
    lightBgClass: "bg-yellow-50"
  },
  red: {
    name: "Red",
    title: "Inspirational Motivator",
    subtitle: "The Energy Catalyst",
    overview: "Red leaders are the spark that ignites teams. They possess an extraordinary ability to communicate vision, generate enthusiasm, and inspire others to action. When a Red enters a room, energy levels rise. They see possibilities where others see obstacles and have a unique gift for helping others believe in themselves and the mission.",
    coreStrengths: [
      "Exceptional communication and presentation skills",
      "Natural ability to inspire and motivate others",
      "Strong vision-casting and storytelling abilities",
      "Genuine enthusiasm that's contagious",
      "Ability to build emotional connections quickly"
    ],
    stressBehaviors: [
      "May become overly optimistic, ignoring realistic constraints",
      "Can struggle with follow-through on details",
      "Tendency to commit to too many initiatives",
      "May appear scattered when juggling multiple visions",
      "Can become emotionally reactive under pressure"
    ],
    misinterpretations: [
      "Often seen as 'all talk' when they're genuinely passionate",
      "Perceived as superficial when they're actually deeply caring",
      "Viewed as unrealistic when offering optimistic perspectives",
      "Seen as attention-seeking when sharing enthusiasm",
      "Misread as lacking depth when being engaging"
    ],
    growthEdges: [
      "Developing stronger follow-through systems",
      "Learning to balance vision with practical planning",
      "Building discipline for detail-oriented work",
      "Cultivating patience for slower-paced processes",
      "Strengthening active listening skills"
    ],
    languageResponds: [
      "\"I love your energy on this!\"",
      "\"You're the perfect person to lead this\"",
      "\"Let's brainstorm big ideas\"",
      "\"Your enthusiasm is contagious\"",
      "\"Help me see the vision\""
    ],
    leadershipStyle: "Red leaders lead through inspiration and connection. They paint compelling pictures of the future that make others want to follow. Their leadership is characterized by warmth, enthusiasm, and an ability to bring diverse people together around a common cause. They inspire loyalty through genuine care and shared excitement.",
    inTeams: "In team settings, Reds naturally energize and unite the group. They excel at kickoff meetings, brainstorming sessions, and moments when morale needs boosting. They're often the ones who remember birthdays, celebrate wins, and keep the team spirit high. Their challenge is staying engaged through the less exciting execution phases.",
    inConflict: "Reds prefer to resolve conflict through dialogue and relationship repair. They seek to understand emotions first and solutions second. Their conflict style is empathetic: acknowledge feelings, restore connection, then address the issue. They may need to develop more comfort with direct confrontation.",
    inLeadership: "As formal leaders, Reds excel at casting vision, building culture, and inspiring teams through change. They create environments where people feel valued and excited about the work. Their challenge is building systems and processes that ensure consistent execution.",
    inLearning: "Reds learn best through interaction, discussion, and storytelling. They prefer collaborative learning environments, group projects, and opportunities to share ideas. They retain information best when connected to emotional or relational context.",
    inHighStakes: "In high-pressure situations, Reds excel at rallying teams and maintaining morale. Their optimism can be a powerful antidote to fear and uncertainty. However, they may need grounding from more analytical team members to ensure realistic planning.",
    withOpposites: "Reds work well with Greens when the Green provides structure and the Red provides energy and buy-in. The Red-Yellow pairing can be powerful when the Red inspires and the Yellow executes, though both need to respect each other's pace.",
    needsFromOthers: [
      "Recognition and appreciation for their contributions",
      "Opportunities to share ideas and enthusiasm",
      "Support with details and follow-through",
      "Flexibility in how goals are achieved",
      "Collaborative rather than isolated work"
    ],
    othersNeedFromThem: [
      "Follow-through on commitments made",
      "Attention to important details",
      "Realistic assessment of timelines",
      "Active listening without immediate idea generation",
      "Acknowledgment when others need quiet focus"
    ],
    developmentStrategies: [
      "Create detailed action plans for each inspiring idea",
      "Partner with detail-oriented colleagues for accountability",
      "Practice pausing before committing to new initiatives",
      "Develop a personal system for tracking commitments",
      "Build in regular check-ins on project details"
    ],
    doList: [
      "Share your vision and enthusiasm regularly",
      "Connect personally with each team member",
      "Celebrate wins publicly and frequently",
      "Create collaborative spaces for idea generation",
      "Use storytelling to communicate key messages"
    ],
    dontList: [
      "Don't overpromise in moments of enthusiasm",
      "Don't ignore important details or logistics",
      "Don't dismiss analytical or critical feedback",
      "Don't dominate conversations with your energy",
      "Don't neglect follow-through on commitments"
    ],
    reflectionQuestions: [
      "Which commitments have I made recently that need follow-through?",
      "How can I better balance my enthusiasm with realistic planning?",
      "Who might appreciate more listening and less advice from me?",
      "What details am I currently overlooking that matter to others?",
      "How can I channel my energy more sustainably?"
    ],
    colorHex: "#DC2626",
    bgClass: "bg-red-500",
    textClass: "text-red-600",
    lightBgClass: "bg-red-50"
  },
  green: {
    name: "Green",
    title: "Analytical Systems Thinker",
    subtitle: "The Strategic Architect",
    overview: "Green leaders are the architects of sustainable success. They see patterns, build systems, and create structures that stand the test of time. When a Green analyzes a situation, they consider all variables, anticipate challenges, and design solutions that are both elegant and effective. They bring order to chaos and quality to quantity.",
    coreStrengths: [
      "Exceptional analytical and strategic thinking",
      "Natural ability to create efficient systems and processes",
      "Strong attention to detail and quality assurance",
      "Data-driven decision making",
      "Ability to anticipate problems before they occur"
    ],
    stressBehaviors: [
      "May become paralyzed by analysis, delaying decisions",
      "Can appear overly critical or perfectionistic",
      "Tendency to withdraw when overwhelmed with data",
      "May resist changes to established systems",
      "Can become frustrated with 'good enough' solutions"
    ],
    misinterpretations: [
      "Often seen as cold when they're being objective",
      "Perceived as slow when they're being thorough",
      "Viewed as negative when offering critical analysis",
      "Seen as rigid when maintaining quality standards",
      "Misread as unemotional when being professional"
    ],
    growthEdges: [
      "Learning to act with imperfect information",
      "Developing comfort with ambiguity and change",
      "Building stronger emotional connections",
      "Embracing 'good enough' when appropriate",
      "Communicating analysis in accessible ways"
    ],
    languageResponds: [
      "\"What does the data tell us?\"",
      "\"Let's think this through systematically\"",
      "\"What are the potential risks?\"",
      "\"Help me understand the logic\"",
      "\"Let's create a process for this\""
    ],
    leadershipStyle: "Green leaders lead through expertise, logic, and quality. They establish high standards, create efficient processes, and make decisions based on evidence. Their leadership is characterized by thoroughness, reliability, and a commitment to excellence. They inspire trust through competence and consistency.",
    inTeams: "In team settings, Greens naturally gravitate toward quality control, process improvement, and strategic planning roles. They ask the hard questions, identify potential problems, and ensure the team doesn't overlook critical details. Their challenge is balancing their need for perfection with team momentum.",
    inConflict: "Greens approach conflict analytically, seeking to understand root causes before proposing solutions. Their conflict style is logical: gather facts, analyze the situation, identify systemic issues, implement structural fixes. They may need to develop more attention to emotional aspects of conflict.",
    inLeadership: "As formal leaders, Greens excel at building efficient organizations, establishing quality standards, and making sound strategic decisions. They create environments of intellectual rigor and continuous improvement. Their challenge is inspiring and motivating teams beyond logical arguments.",
    inLearning: "Greens learn best through structured, logical presentations of information. They prefer detailed documentation, clear frameworks, and opportunities for deep analysis. They retain information best when they understand the underlying logic and can organize it systematically.",
    inHighStakes: "In high-pressure situations, Greens provide crucial analytical perspective. Their ability to remain objective and consider multiple variables helps teams avoid costly mistakes. However, they may need to accelerate their decision-making process in true emergencies.",
    withOpposites: "Greens work well with Reds when the Red provides energy and buy-in while the Green provides structure and quality control. The Green-Yellow pairing can be powerful when the Green designs systems and the Yellow drives execution.",
    needsFromOthers: [
      "Time to analyze and think before responding",
      "Respect for their need for accuracy and quality",
      "Clear, logical communication",
      "Appreciation for their attention to detail",
      "Patience with their thorough approach"
    ],
    othersNeedFromThem: [
      "Faster decision-making when appropriate",
      "More accessible communication of complex ideas",
      "Flexibility when 'good enough' is acceptable",
      "Recognition of emotional and relational factors",
      "Encouragement and positive feedback"
    ],
    developmentStrategies: [
      "Practice making decisions with 80% information",
      "Build in regular social interactions with team members",
      "Develop comfort with presenting imperfect ideas",
      "Learn to recognize when analysis delays action",
      "Create personal guidelines for 'good enough' standards"
    ],
    doList: [
      "Create clear systems and processes for your team",
      "Share your analytical insights in accessible ways",
      "Establish quality standards with clear criteria",
      "Anticipate and address potential problems proactively",
      "Document best practices for organizational learning"
    ],
    dontList: [
      "Don't let perfect be the enemy of good",
      "Don't dismiss emotional or intuitive input",
      "Don't overwhelm others with data and analysis",
      "Don't delay decisions indefinitely for more data",
      "Don't forget to celebrate wins and progress"
    ],
    reflectionQuestions: [
      "When has my need for perfection delayed important progress?",
      "How can I communicate my insights more accessibly?",
      "Who on my team might appreciate more personal connection?",
      "What decisions am I avoiding due to incomplete data?",
      "How can I better balance quality with momentum?"
    ],
    colorHex: "#16A34A",
    bgClass: "bg-green-500",
    textClass: "text-green-600",
    lightBgClass: "bg-green-50"
  },
  blue: {
    name: "Blue",
    title: "Creative Innovator",
    subtitle: "The Possibility Explorer",
    overview: "Blue leaders are the visionaries who see what could be. They possess an extraordinary ability to imagine futures that don't yet exist and inspire others to help create them. When a Blue approaches a problem, they see opportunities for innovation. They question assumptions, challenge conventions, and find creative solutions that others overlook.",
    coreStrengths: [
      "Exceptional creativity and innovative thinking",
      "Natural ability to see possibilities and opportunities",
      "Strong big-picture and strategic vision",
      "Comfort with ambiguity and change",
      "Ability to connect disparate ideas in novel ways"
    ],
    stressBehaviors: [
      "May become scattered across too many ideas",
      "Can struggle with practical implementation details",
      "Tendency to lose interest once the creative phase ends",
      "May resist structure and constraints",
      "Can become frustrated with repetitive or routine work"
    ],
    misinterpretations: [
      "Often seen as unrealistic when they're being visionary",
      "Perceived as unfocused when exploring possibilities",
      "Viewed as impractical when offering creative solutions",
      "Seen as resistant when questioning constraints",
      "Misread as uncommitted when seeking novelty"
    ],
    growthEdges: [
      "Developing stronger execution and follow-through",
      "Learning to work within necessary constraints",
      "Building appreciation for routine and consistency",
      "Cultivating patience for incremental progress",
      "Strengthening attention to practical details"
    ],
    languageResponds: [
      "\"What if we tried something completely different?\"",
      "\"There are no bad ideas right now\"",
      "\"Let's reimagine this from scratch\"",
      "\"I want your creative perspective\"",
      "\"Think bigger—what's possible?\""
    ],
    leadershipStyle: "Blue leaders lead through vision and innovation. They challenge the status quo, inspire creative thinking, and create space for experimentation. Their leadership is characterized by openness, curiosity, and a willingness to take calculated risks. They inspire by showing others what's possible.",
    inTeams: "In team settings, Blues naturally gravitate toward innovation, brainstorming, and strategic visioning roles. They ask 'what if?' questions, challenge assumptions, and push the team to think beyond obvious solutions. Their challenge is staying engaged through implementation phases.",
    inConflict: "Blues approach conflict creatively, often reframing problems to find unexpected solutions. Their conflict style is innovative: look for third options, question underlying assumptions, find win-win possibilities. They may need to develop more appreciation for addressing conflicts directly.",
    inLeadership: "As formal leaders, Blues excel at driving innovation, leading change, and creating cultures of creativity. They build environments where experimentation is encouraged and failure is viewed as learning. Their challenge is building operational excellence and consistency.",
    inLearning: "Blues learn best through exploration, experimentation, and creative application. They prefer open-ended projects, opportunities for innovation, and freedom to approach problems their own way. They retain information best when they can make it their own.",
    inHighStakes: "In high-pressure situations, Blues bring creative problem-solving and the ability to see options others miss. Their comfort with ambiguity helps teams navigate unprecedented challenges. However, they may need support from more structured team members for implementation.",
    withOpposites: "Blues work well with Yellows when the Blue innovates and the Yellow executes. The Blue-Green pairing can be powerful when the Blue provides creative vision and the Green ensures practical viability.",
    needsFromOthers: [
      "Freedom to explore and innovate",
      "Appreciation for their creative contributions",
      "Flexibility in how goals are achieved",
      "Support with implementation details",
      "Patience with their non-linear thinking"
    ],
    othersNeedFromThem: [
      "Follow-through on creative ideas",
      "Attention to practical constraints",
      "Respect for established processes when appropriate",
      "Focus on current priorities before new ideas",
      "Clear communication of creative concepts"
    ],
    developmentStrategies: [
      "Partner with execution-oriented colleagues",
      "Create systems for capturing and prioritizing ideas",
      "Practice finishing projects before starting new ones",
      "Develop appreciation for the value of routine",
      "Build in checkpoints to ensure implementation"
    ],
    doList: [
      "Share your creative vision with enthusiasm",
      "Challenge assumptions constructively",
      "Create space for team innovation and experimentation",
      "Connect creative ideas to strategic goals",
      "Celebrate creative risks, even when they don't succeed"
    ],
    dontList: [
      "Don't abandon ideas before implementation",
      "Don't dismiss practical constraints entirely",
      "Don't overwhelm teams with too many new ideas",
      "Don't neglect routine responsibilities for creative pursuits",
      "Don't invalidate others' need for structure"
    ],
    reflectionQuestions: [
      "Which creative projects need my attention to completion?",
      "How can I better balance innovation with execution?",
      "Who might help me implement my best ideas?",
      "What practical constraints am I currently ignoring?",
      "How can I channel my creativity more sustainably?"
    ],
    colorHex: "#2563EB",
    bgClass: "bg-blue-500",
    textClass: "text-blue-600",
    lightBgClass: "bg-blue-50"
  }
};

const ProfessionalResults = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<Results | null>(null);

  useEffect(() => {
    const storedResults = localStorage.getItem('professionalAssessmentResults');
    if (storedResults) {
      setResults(JSON.parse(storedResults));
    } else {
      navigate('/b2b/company-portal');
    }
  }, [navigate]);

  if (!results) {
    return null;
  }

  const sortedScores = Object.entries(results.scores)
    .sort(([, a], [, b]) => b - a);
  
  const dominantColor = sortedScores[0][0];
  const secondaryColorName = sortedScores[1][0];
  
  const profile = COLOR_PROFILES[dominantColor as keyof typeof COLOR_PROFILES];
  const secondaryProfile = COLOR_PROFILES[secondaryColorName as keyof typeof COLOR_PROFILES];

  const colorScoresWithPercentage = sortedScores.map(([color, score]) => ({
    color,
    score,
    percentage: Math.round((score / results.totalQuestions) * 100)
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="py-8 sm:py-16">
        <div className="container-wide">
          <div className="max-w-5xl mx-auto">
            
            {/* Header */}
            <div className="text-center mb-12 animate-fade-in">
              <Badge variant="secondary" className="mb-4 text-lg px-6 py-2">
                Assessment Complete
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                Your Professional Leadership Profile
              </h1>
              <p className="text-xl text-muted-foreground">
                Comprehensive 50-Question Assessment Results
              </p>
            </div>
            {/* Primary Color Hero */}
            <Card className="rounded-3xl shadow-xl border-2 mb-8 overflow-hidden" style={{ borderColor: profile.colorHex }}>
              <div className={`${profile.bgClass} p-8 text-white`}>
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-white/20 text-white text-lg px-6 py-2">
                    Your Primary Color
                  </Badge>
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <span className="text-3xl font-bold">{profile.name[0]}</span>
                  </div>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-2">{profile.title}</h2>
                <p className="text-xl opacity-90">{profile.subtitle}</p>
              </div>
              <CardContent className="p-8">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {profile.overview}
                </p>
              </CardContent>
            </Card>

            <Logos3 heading="We Work With" className="py-0 mb-8" />

            {/* Color Distribution */}
            <Card className="rounded-3xl shadow-xl border-2 border-primary/20 mb-8">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Target className="w-6 h-6" />
                  Your Color Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {colorScoresWithPercentage.map(({ color, score, percentage }) => {
                    const colorProfile = COLOR_PROFILES[color as keyof typeof COLOR_PROFILES];
                    return (
                      <div key={color}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 ${colorProfile.bgClass} rounded-lg`}></div>
                            <div>
                              <span className="font-semibold">{colorProfile.name}</span>
                              <span className="text-sm text-muted-foreground ml-2">({colorProfile.title})</span>
                            </div>
                          </div>
                          <span className="font-semibold">
                            {percentage}%
                          </span>
                        </div>
                        <div className="h-3 bg-muted/40 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${colorProfile.bgClass} rounded-full transition-all duration-700`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Tabbed Content */}
            <Tabs defaultValue="strengths" className="mb-8">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-2 bg-transparent p-0">
                <TabsTrigger value="strengths" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3">
                  <Zap className="w-4 h-4 mr-2" />
                  Strengths
                </TabsTrigger>
                <TabsTrigger value="growth" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Growth
                </TabsTrigger>
                <TabsTrigger value="contexts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3">
                  <Users className="w-4 h-4 mr-2" />
                  Contexts
                </TabsTrigger>
                <TabsTrigger value="action" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Action Plan
                </TabsTrigger>
              </TabsList>

              {/* Strengths Tab */}
              <TabsContent value="strengths" className="mt-6 space-y-6">
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${profile.textClass}`}>
                      <Zap className="w-5 h-5" />
                      Core Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {profile.coreStrengths.map((strength, i) => (
                        <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${profile.lightBgClass}`}>
                          <CheckCircle className={`w-5 h-5 mt-0.5 ${profile.textClass}`} />
                          <span>{strength}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      Leadership Style in Action
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{profile.leadershipStyle}</p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Language You Respond To
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      {profile.languageResponds.map((phrase, i) => (
                        <div key={i} className="p-3 bg-muted/50 rounded-lg italic text-muted-foreground">
                          {phrase}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Growth Tab */}
              <TabsContent value="growth" className="mt-6 space-y-6">
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-600">
                      <AlertTriangle className="w-5 h-5" />
                      Stress Behaviors
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">What happens when you're under pressure</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {profile.stressBehaviors.map((behavior, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50">
                          <AlertTriangle className="w-5 h-5 mt-0.5 text-amber-600" />
                          <span>{behavior}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      How Others May Misunderstand You
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {profile.misinterpretations.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <span className="text-muted-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${profile.textClass}`}>
                      <TrendingUp className="w-5 h-5" />
                      Growth Edges
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">What you must consciously develop</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {profile.growthEdges.map((edge, i) => (
                        <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${profile.lightBgClass}`}>
                          <TrendingUp className={`w-5 h-5 mt-0.5 ${profile.textClass}`} />
                          <span>{edge}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Contexts Tab */}
              <TabsContent value="contexts" className="mt-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-lg">In Teams</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm leading-relaxed">{profile.inTeams}</p>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-lg">In Conflict</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm leading-relaxed">{profile.inConflict}</p>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-lg">In Leadership</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm leading-relaxed">{profile.inLeadership}</p>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-lg">In Learning</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm leading-relaxed">{profile.inLearning}</p>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-lg">In High-Stakes Situations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm leading-relaxed">{profile.inHighStakes}</p>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-lg">With Opposite Roles</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm leading-relaxed">{profile.withOpposites}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="rounded-2xl border-2" style={{ borderColor: profile.colorHex }}>
                    <CardHeader className={profile.lightBgClass}>
                      <CardTitle className="text-lg">What You Need From Others</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <ul className="space-y-2">
                        {profile.needsFromOthers.map((need, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className={profile.textClass}>•</span>
                            <span>{need}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-2" style={{ borderColor: secondaryProfile.colorHex }}>
                    <CardHeader className={secondaryProfile.lightBgClass}>
                      <CardTitle className="text-lg">What Others Need From You</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <ul className="space-y-2">
                        {profile.othersNeedFromThem.map((need, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className={secondaryProfile.textClass}>•</span>
                            <span>{need}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Action Plan Tab */}
              <TabsContent value="action" className="mt-6 space-y-6">
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5" />
                      Development Strategies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {profile.developmentStrategies.map((strategy, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <span className="font-bold text-primary">{i + 1}.</span>
                          <span>{strategy}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="rounded-2xl border-2 border-green-200">
                    <CardHeader className="bg-green-50">
                      <CardTitle className="text-lg text-green-700 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Do
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <ul className="space-y-2">
                        {profile.doList.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 mt-0.5 text-green-600" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-2 border-red-200">
                    <CardHeader className="bg-red-50">
                      <CardTitle className="text-lg text-red-700 flex items-center gap-2">
                        <XCircle className="w-5 h-5" />
                        Don't
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <ul className="space-y-2">
                        {profile.dontList.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <XCircle className="w-4 h-4 mt-0.5 text-red-600" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      Reflection Questions
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Take time to think through these regularly</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {profile.reflectionQuestions.map((question, i) => (
                        <div key={i} className={`p-4 rounded-lg ${profile.lightBgClass} italic`}>
                          {i + 1}. {question}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Secondary Color Summary */}
            <Card className="rounded-2xl shadow-lg mb-8 overflow-hidden" style={{ borderColor: secondaryProfile.colorHex, borderWidth: 2 }}>
              <div className={`${secondaryProfile.bgClass} p-6 text-white`}>
                <Badge className="bg-white/20 text-white mb-2">Your Secondary Color</Badge>
                <h3 className="text-2xl font-bold">{secondaryProfile.title}</h3>
                <p className="opacity-90">{secondaryProfile.subtitle}</p>
              </div>
              <CardContent className="p-6">
                <p className="text-muted-foreground mb-4">{secondaryProfile.overview.substring(0, 300)}...</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Key Strengths</h4>
                    <ul className="text-sm space-y-1">
                      {secondaryProfile.coreStrengths.slice(0, 3).map((s, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle className={`w-4 h-4 ${secondaryProfile.textClass}`} />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Growth Edges</h4>
                    <ul className="text-sm space-y-1">
                      {secondaryProfile.growthEdges.slice(0, 3).map((e, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <TrendingUp className={`w-4 h-4 ${secondaryProfile.textClass}`} />
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
              <Button 
                size="lg" 
                variant="default"
                onClick={() => {
                  exportProfessional50QPDF({
                    dominantColor: results.dominantColor,
                    scores: results.scores,
                    totalQuestions: results.totalQuestions,
                    participantName: localStorage.getItem('participantName') || undefined,
                    organization: localStorage.getItem('organizationName') || undefined,
                    assessmentDate: new Date().toLocaleDateString()
                  });
                }}
                className="flex items-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Download Full Report (PDF)
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => window.print()}
                className="flex items-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                Quick Print
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/b2b/company-portal')}
              >
                Back to Company Portal
              </Button>
            </div>

            <div className="mt-10">
              <RoleColorIdentityCard
                name={localStorage.getItem('participantName')}
                primaryColor={results.dominantColor}
                secondaryColor={secondaryColorName}
                className="mb-6"
              />
              <SendToFriendCard color={results.dominantColor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalResults;
