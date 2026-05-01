import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Crown } from "lucide-react";
import { Navbar } from "@/components/navigation/Navbar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { shuffleArray } from "@/lib/utils";
import { useAssessmentProgress } from "@/hooks/useAssessmentProgress";
import { ResumeProgressModal } from "@/components/assessment/ResumeProgressModal";
import { AutoSaveIndicator } from "@/components/assessment/AutoSaveIndicator";
import { PauseButton } from "@/components/assessment/PauseButton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// 50 questions for Pro assessment - organized by Tuckman's team development stages
export const proQuestions = [
  // FORMING STAGE - Questions 1-10 (Building Connection)
  {
    id: 1,
    stage: "Forming",
    question: "When building connection in a new team, you naturally:",
    options: [
      { text: "Take charge and set clear direction from day one", color: "yellow" },
      { text: "Create energy and enthusiasm to bring people together", color: "red" },
      { text: "Analyze team dynamics and establish structured processes", color: "green" },
      { text: "Focus on understanding each person and building trust", color: "blue" },
    ],
  },
  {
    id: 2,
    stage: "Forming",
    question: "When establishing organizational culture from the ground up, you emphasize:",
    options: [
      { text: "Performance standards and accountability frameworks", color: "yellow" },
      { text: "Innovation, creativity, and breakthrough thinking", color: "red" },
      { text: "Excellence, continuous improvement, and systematic development", color: "green" },
      { text: "Inclusion, psychological safety, and authentic relationships", color: "blue" },
    ],
  },
  {
    id: 3,
    stage: "Forming",
    question: "Your approach to talent acquisition in the early formation stage emphasizes:",
    options: [
      { text: "Track record of results, achievements, and proven execution", color: "yellow" },
      { text: "Creative potential, cultural fit, and innovative thinking", color: "red" },
      { text: "Technical competence, reliability, and systematic skills", color: "green" },
      { text: "Emotional intelligence, collaboration, and relationship building", color: "blue" },
    ],
  },
  {
    id: 4,
    stage: "Forming",
    question: "When onboarding senior executives into a new organization, you:",
    options: [
      { text: "Set aggressive 90-day goals to prove immediate value", color: "yellow" },
      { text: "Inspire them with the transformational vision and possibilities", color: "red" },
      { text: "Provide comprehensive strategic context and systematic orientation", color: "green" },
      { text: "Invest in relationship building and cultural integration", color: "blue" },
    ],
  },
  {
    id: 5,
    stage: "Forming",
    question: "Your philosophy for establishing initial team foundations centers on:",
    options: [
      { text: "Quick wins that build momentum and establish credibility", color: "yellow" },
      { text: "Creating excitement about breakthrough possibilities", color: "red" },
      { text: "Building systematic approaches, documentation, and frameworks", color: "green" },
      { text: "Creating psychological safety, trust, and open communication", color: "blue" },
    ],
  },
  {
    id: 6,
    stage: "Forming",
    question: "When establishing board relationships in a new role, you:",
    options: [
      { text: "Focus on delivering results and demonstrating executive capability", color: "yellow" },
      { text: "Share compelling vision and inspire confidence in the future", color: "red" },
      { text: "Provide comprehensive analysis and systematic reporting", color: "green" },
      { text: "Build authentic relationships and establish transparent dialogue", color: "blue" },
    ],
  },
  {
    id: 7,
    stage: "Forming",
    question: "Your approach to establishing stakeholder relationships emphasizes:",
    options: [
      { text: "Clear deliverables, mutual benefit, and measurable outcomes", color: "yellow" },
      { text: "Shared vision, aligned purpose, and transformational possibilities", color: "red" },
      { text: "Formal agreements, structured processes, and systematic engagement", color: "green" },
      { text: "Trust building, relationship investment, and genuine partnership", color: "blue" },
    ],
  },
  {
    id: 8,
    stage: "Forming",
    question: "When forming strategic partnerships, you prioritize:",
    options: [
      { text: "Speed to market and competitive advantage", color: "yellow" },
      { text: "Innovation potential and breakthrough opportunities", color: "red" },
      { text: "Due diligence, risk analysis, and systematic evaluation", color: "green" },
      { text: "Cultural alignment and long-term relationship potential", color: "blue" },
    ],
  },
  {
    id: 9,
    stage: "Forming",
    question: "Your initial communication strategy with new teams focuses on:",
    options: [
      { text: "Clear expectations, performance metrics, and accountability", color: "yellow" },
      { text: "Inspiring vision, creative possibilities, and transformational goals", color: "red" },
      { text: "Structured information sharing and systematic feedback loops", color: "green" },
      { text: "Open dialogue, individual understanding, and relationship building", color: "blue" },
    ],
  },
  {
    id: 10,
    stage: "Forming",
    question: "When establishing governance structures in new organizations, you:",
    options: [
      { text: "Create lean structures that enable rapid decision-making", color: "yellow" },
      { text: "Design adaptive frameworks that encourage innovation", color: "red" },
      { text: "Build comprehensive systems with clear roles and processes", color: "green" },
      { text: "Ensure inclusive representation and stakeholder voice", color: "blue" },
    ],
  },

  // STORMING STAGE - Questions 11-20 (Navigating Friction)
  {
    id: 11,
    stage: "Storming",
    question: "When navigating organizational politics and power dynamics, you:",
    options: [
      { text: "Navigate efficiently to achieve strategic objectives", color: "yellow" },
      { text: "Use influence to build coalitions for transformational change", color: "red" },
      { text: "Study power structures and plan systematic engagement strategies", color: "green" },
      { text: "Focus on building authentic relationships across all stakeholders", color: "blue" },
    ],
  },
  {
    id: 12,
    stage: "Storming",
    question: "Your approach to managing board conflicts and disagreements is:",
    options: [
      { text: "Drive toward resolution with data-driven recommendations", color: "yellow" },
      { text: "Reframe conflicts as opportunities for breakthrough thinking", color: "red" },
      { text: "Facilitate structured debate using frameworks and analysis", color: "green" },
      { text: "Ensure all perspectives are heard before building consensus", color: "blue" },
    ],
  },
  {
    id: 13,
    stage: "Storming",
    question: "When facing resistance to strategic change initiatives, you:",
    options: [
      { text: "Push through with strong leadership and clear communication", color: "yellow" },
      { text: "Inspire people to see beyond current limitations to future possibilities", color: "red" },
      { text: "Address concerns systematically with data and structured communication", color: "green" },
      { text: "Listen deeply to understand root concerns and build inclusive solutions", color: "blue" },
    ],
  },
  {
    id: 14,
    stage: "Storming",
    question: "Your conflict resolution style with senior leadership teams involves:",
    options: [
      { text: "Direct confrontation of issues to restore team effectiveness", color: "yellow" },
      { text: "Helping leaders see how differences can create complementary strength", color: "red" },
      { text: "Creating clear behavioral frameworks and performance expectations", color: "green" },
      { text: "Coaching individuals to understand and appreciate different leadership styles", color: "blue" },
    ],
  },
  {
    id: 15,
    stage: "Storming",
    question: "When managing competing stakeholder demands, you:",
    options: [
      { text: "Make tough decisions quickly to maintain organizational momentum", color: "yellow" },
      { text: "Find creative solutions that transcend traditional either-or thinking", color: "red" },
      { text: "Use systematic evaluation criteria to prioritize objectively", color: "green" },
      { text: "Help stakeholders understand each other's perspectives and needs", color: "blue" },
    ],
  },
  {
    id: 16,
    stage: "Storming",
    question: "During organizational restructuring, you focus on:",
    options: [
      { text: "Speed of execution and minimizing disruption to performance", color: "yellow" },
      { text: "Communicating the transformational vision and future opportunities", color: "red" },
      { text: "Systematic planning, communication, and change management", color: "green" },
      { text: "Supporting affected individuals and maintaining team cohesion", color: "blue" },
    ],
  },
  {
    id: 17,
    stage: "Storming",
    question: "Your approach to managing cultural integration after mergers involves:",
    options: [
      { text: "Quick decision-making on operating models to capture synergies", color: "yellow" },
      { text: "Creating new shared vision that inspires all legacy cultures", color: "red" },
      { text: "Systematic cultural assessment and structured integration planning", color: "green" },
      { text: "Extensive listening and relationship building across organizations", color: "blue" },
    ],
  },
  {
    id: 18,
    stage: "Storming",
    question: "When leading through industry disruption, you:",
    options: [
      { text: "Quickly adapt operations to new realities and capture opportunities", color: "yellow" },
      { text: "Lead the disruption with bold innovation and market transformation", color: "red" },
      { text: "Analyze trends systematically and plan strategic responses", color: "green" },
      { text: "Unite stakeholders around shared challenges and collaborative solutions", color: "blue" },
    ],
  },
  {
    id: 19,
    stage: "Storming",
    question: "Your risk management philosophy during turbulent periods emphasizes:",
    options: [
      { text: "Taking calculated risks for competitive advantage and growth", color: "yellow" },
      { text: "Embracing bold risks for breakthrough opportunities and innovation", color: "red" },
      { text: "Conducting thorough risk analysis before strategic decisions", color: "green" },
      { text: "Considering how risks affect organizational stability and people", color: "blue" },
    ],
  },
  {
    id: 20,
    stage: "Storming",
    question: "When managing crisis situations, your leadership approach is:",
    options: [
      { text: "Take decisive action to stabilize quickly and restore operations", color: "yellow" },
      { text: "Rally people around compelling vision of recovery and renewal", color: "red" },
      { text: "Develop comprehensive crisis management plans and systematic responses", color: "green" },
      { text: "Support organizational resilience, wellbeing, and collective recovery", color: "blue" },
    ],
  },

  // NORMING STAGE - Questions 21-30 (Establishing Flow)
  {
    id: 21,
    stage: "Norming",
    question: "When establishing flow and organizational norms, you prefer to:",
    options: [
      { text: "Drive execution excellence and maintain momentum toward strategic goals", color: "yellow" },
      { text: "Inspire innovation and creative possibilities within operational frameworks", color: "red" },
      { text: "Build logical systems and clear operational processes", color: "green" },
      { text: "Ensure all stakeholders feel heard and supported in process development", color: "blue" },
    ],
  },
  {
    id: 22,
    stage: "Norming",
    question: "Your approach to establishing performance management systems emphasizes:",
    options: [
      { text: "High performance standards that drive exceptional results", color: "yellow" },
      { text: "Inspiring peak performance through purpose and creative challenge", color: "red" },
      { text: "Systematic development frameworks and objective measurement", color: "green" },
      { text: "Individual coaching, support, and personalized growth plans", color: "blue" },
    ],
  },
  {
    id: 23,
    stage: "Norming",
    question: "When implementing new operational standards across the organization, you:",
    options: [
      { text: "Focus on rapid adoption and immediate performance improvement", color: "yellow" },
      { text: "Help teams see how standards enable greater creative freedom", color: "red" },
      { text: "Create comprehensive training and systematic implementation plans", color: "green" },
      { text: "Involve teams in co-creating standards they can enthusiastically embrace", color: "blue" },
    ],
  },
  {
    id: 24,
    stage: "Norming",
    question: "Your philosophy for establishing communication protocols focuses on:",
    options: [
      { text: "Efficient information flow that supports rapid decision-making", color: "yellow" },
      { text: "Open sharing of ideas, creative inspiration, and innovative thinking", color: "red" },
      { text: "Structured reporting, documentation systems, and knowledge management", color: "green" },
      { text: "Regular relationship maintenance and inclusive dialogue", color: "blue" },
    ],
  },
  {
    id: 25,
    stage: "Norming",
    question: "When scaling successful practices across multiple business units, you:",
    options: [
      { text: "Rapidly implement proven approaches for maximum efficiency", color: "yellow" },
      { text: "Adapt and innovate practices for different contexts and cultures", color: "red" },
      { text: "Document and systematize methods for consistent replication", color: "green" },
      { text: "Help teams understand cultural elements behind successful practices", color: "blue" },
    ],
  },
  {
    id: 26,
    stage: "Norming",
    question: "Your approach to budget and financial management emphasizes:",
    options: [
      { text: "ROI optimization, cost efficiency, and resource productivity", color: "yellow" },
      { text: "Strategic investment in growth opportunities and innovation", color: "red" },
      { text: "Detailed financial models, controls, and systematic planning", color: "green" },
      { text: "Balanced financial goals that consider organizational and individual needs", color: "blue" },
    ],
  },
  {
    id: 27,
    stage: "Norming",
    question: "When establishing quality standards and continuous improvement, you:",
    options: [
      { text: "Set aggressive benchmarks that push organizational performance", color: "yellow" },
      { text: "Encourage breakthrough thinking about what quality could become", color: "red" },
      { text: "Build systematic measurement and improvement methodologies", color: "green" },
      { text: "Engage all stakeholders in defining and maintaining quality standards", color: "blue" },
    ],
  },
  {
    id: 28,
    stage: "Norming",
    question: "Your leadership rhythm during stable operations includes:",
    options: [
      { text: "Fast-paced cycles with regular performance optimization", color: "yellow" },
      { text: "Dynamic innovation sprints balanced with operational excellence", color: "red" },
      { text: "Consistent processes with systematic review and improvement cycles", color: "green" },
      { text: "Regular organizational development and relationship building activities", color: "blue" },
    ],
  },
  {
    id: 29,
    stage: "Norming",
    question: "When organizational workflows need optimization, you:",
    options: [
      { text: "Quickly implement changes that improve efficiency and results", color: "yellow" },
      { text: "Encourage experimentation with innovative approaches and creative solutions", color: "red" },
      { text: "Analyze current processes and design systematic improvements", color: "green" },
      { text: "Involve the organization in co-creating better ways of working together", color: "blue" },
    ],
  },
  {
    id: 30,
    stage: "Norming",
    question: "Your succession planning and leadership development approach emphasizes:",
    options: [
      { text: "Identifying and fast-tracking high performers with proven results", color: "yellow" },
      { text: "Developing visionary leaders who can drive future transformation", color: "red" },
      { text: "Creating systematic leadership development and knowledge transfer", color: "green" },
      { text: "Mentoring and coaching emerging talent with personalized development", color: "blue" },
    ],
  },

  // PERFORMING STAGE - Questions 31-40 (Reaching Peak Productivity)
  {
    id: 31,
    stage: "Performing",
    question: "When the organization reaches peak productivity, you focus on:",
    options: [
      { text: "Pushing for even higher performance and competitive advantage", color: "yellow" },
      { text: "Channeling organizational energy toward breakthrough innovations", color: "red" },
      { text: "Optimizing systems for sustainable excellence and long-term growth", color: "green" },
      { text: "Maintaining organizational cohesion while celebrating collective achievements", color: "blue" },
    ],
  },
  {
    id: 32,
    stage: "Performing",
    question: "Your approach to sustaining high organizational performance involves:",
    options: [
      { text: "Continuously raising performance bars and challenging the organization", color: "yellow" },
      { text: "Keeping the organization inspired with evolving visions and creative challenges", color: "red" },
      { text: "Monitoring key metrics and fine-tuning organizational processes regularly", color: "green" },
      { text: "Investing in organizational development and preventing leadership burnout", color: "blue" },
    ],
  },
  {
    id: 33,
    stage: "Performing",
    question: "When managing high-performing global operations, your style is:",
    options: [
      { text: "Strategic direction with operational autonomy and clear accountability", color: "yellow" },
      { text: "Visionary guidance with creative empowerment and innovative freedom", color: "red" },
      { text: "Systematic oversight with quality assurance and performance optimization", color: "green" },
      { text: "Supportive coaching with individual development and cultural sensitivity", color: "blue" },
    ],
  },
  {
    id: 34,
    stage: "Performing",
    question: "Your networking and industry relationship approach emphasizes:",
    options: [
      { text: "Strategic connections for mutual benefit and business advantage", color: "yellow" },
      { text: "Inspiring relationships around shared vision and industry transformation", color: "red" },
      { text: "Systematic relationship building and knowledge sharing over time", color: "green" },
      { text: "Authentic connections based on genuine interest and mutual support", color: "blue" },
    ],
  },
  {
    id: 35,
    stage: "Performing",
    question: "When implementing advanced technology during peak performance, you:",
    options: [
      { text: "Adopt quickly for competitive advantage and operational efficiency", color: "yellow" },
      { text: "Leverage technology for breakthrough innovation and market disruption", color: "red" },
      { text: "Plan careful integration, training, and systematic implementation", color: "green" },
      { text: "Consider organizational impact, culture, and individual adaptation needs", color: "blue" },
    ],
  },
  {
    id: 36,
    stage: "Performing",
    question: "Your approach to customer relationship management at scale focuses on:",
    options: [
      { text: "Delivering results that consistently exceed expectations and drive loyalty", color: "yellow" },
      { text: "Creating emotionally engaging experiences and innovative value propositions", color: "red" },
      { text: "Building systematic service excellence and operational consistency", color: "green" },
      { text: "Developing deep, trust-based partnerships and long-term relationships", color: "blue" },
    ],
  },
  {
    id: 37,
    stage: "Performing",
    question: "When entering new markets during peak organizational performance, you:",
    options: [
      { text: "Move fast to capture first-mover advantage and market share", color: "yellow" },
      { text: "Disrupt markets with innovative value propositions and creative approaches", color: "red" },
      { text: "Conduct thorough market research and systematic entry planning", color: "green" },
      { text: "Build local partnerships, relationships, and cultural understanding", color: "blue" },
    ],
  },
  {
    id: 38,
    stage: "Performing",
    question: "Your philosophy for maintaining competitive strategy centers on:",
    options: [
      { text: "Execution excellence and operational superiority", color: "yellow" },
      { text: "Breakthrough differentiation and continuous innovation", color: "red" },
      { text: "Systematic competitive analysis and strategic positioning", color: "green" },
      { text: "Collaborative ecosystem advantages and partnership networks", color: "blue" },
    ],
  },
  {
    id: 39,
    stage: "Performing",
    question: "When managing corporate responsibility at organizational scale, you:",
    options: [
      { text: "Focus on strategic initiatives that drive measurable business value", color: "yellow" },
      { text: "Lead transformative impact on society, environment, and industry", color: "red" },
      { text: "Implement systematic measurement, reporting, and continuous improvement", color: "green" },
      { text: "Demonstrate authentic commitment to all stakeholder wellbeing", color: "blue" },
    ],
  },
  {
    id: 40,
    stage: "Performing",
    question: "Your delegation style with high-performing leadership teams involves:",
    options: [
      { text: "Setting clear strategic outcomes and trusting teams to deliver excellence", color: "yellow" },
      { text: "Inspiring teams with bigger picture purpose and creative empowerment", color: "red" },
      { text: "Providing strategic frameworks while allowing innovative execution", color: "green" },
      { text: "Matching strategic assignments to individual strengths and leadership styles", color: "blue" },
    ],
  },

  // ADJOURNING STAGE - Questions 41-50 (Ending with Clarity and Reflection)
  {
    id: 41,
    stage: "Adjourning",
    question: "When major strategic initiatives come to completion, you focus on:",
    options: [
      { text: "Capturing measurable results and operational lessons for future efficiency", color: "yellow" },
      { text: "Celebrating transformational achievements and inspiring future possibilities", color: "red" },
      { text: "Documenting systematic processes and creating institutional knowledge repositories", color: "green" },
      { text: "Honoring organizational relationships and supporting individual career transitions", color: "blue" },
    ],
  },
  {
    id: 42,
    stage: "Adjourning",
    question: "Your approach to organizational transition and closure includes:",
    options: [
      { text: "Efficient transition to next strategic priorities with clear operational handoffs", color: "yellow" },
      { text: "Reflection on transformational impact and vision for future organizational endeavors", color: "red" },
      { text: "Comprehensive documentation, evaluation, and systematic knowledge transfer", color: "green" },
      { text: "Organizational appreciation and individual career development support", color: "blue" },
    ],
  },
  {
    id: 43,
    stage: "Adjourning",
    question: "When senior executives transition from your organization, you:",
    options: [
      { text: "Ensure smooth succession that maintains business continuity and performance", color: "yellow" },
      { text: "Help them envision how their experience contributes to industry leadership", color: "red" },
      { text: "Create detailed transition plans and systematic knowledge transfer protocols", color: "green" },
      { text: "Provide ongoing mentoring and support during their leadership transition", color: "blue" },
    ],
  },
  {
    id: 44,
    stage: "Adjourning",
    question: "Your legacy focus when completing transformational leadership roles emphasizes:",
    options: [
      { text: "Measurable organizational impact and enhanced institutional capabilities", color: "yellow" },
      { text: "Cultural transformation and inspiration for continued innovation", color: "red" },
      { text: "Sustainable systems, processes, and institutional knowledge", color: "green" },
      { text: "Developed leadership talent and strengthened organizational relationships", color: "blue" },
    ],
  },
  {
    id: 45,
    stage: "Adjourning",
    question: "When reflecting on organizational achievements, you measure success by:",
    options: [
      { text: "Achievement of strategic goals and quantifiable organizational results", color: "yellow" },
      { text: "Breakthrough innovations and positive transformation across the industry", color: "red" },
      { text: "Systematic improvements and sustainable operational excellence", color: "green" },
      { text: "Individual leadership growth and strengthened organizational relationships", color: "blue" },
    ],
  },
  {
    id: 46,
    stage: "Adjourning",
    question: "Your approach to knowledge transfer and institutional memory involves:",
    options: [
      { text: "Capturing key strategic insights and operational best practices", color: "yellow" },
      { text: "Sharing transformational stories and inspiring future innovation", color: "red" },
      { text: "Creating comprehensive documentation and systematic knowledge repositories", color: "green" },
      { text: "Mentoring relationships and experiential learning transfer", color: "blue" },
    ],
  },
  {
    id: 47,
    stage: "Adjourning",
    question: "When dissolving strategic partnerships or alliances, you:",
    options: [
      { text: "Focus on protecting mutual interests and maintaining future opportunities", color: "yellow" },
      { text: "Celebrate shared achievements and envision potential future collaborations", color: "red" },
      { text: "Execute systematic wind-down with comprehensive documentation", color: "green" },
      { text: "Maintain relationships and provide support during transition periods", color: "blue" },
    ],
  },
  {
    id: 48,
    stage: "Adjourning",
    question: "Your final leadership communication with departing organizations emphasizes:",
    options: [
      { text: "Results achieved, capabilities built, and competitive position strengthened", color: "yellow" },
      { text: "Transformational journey, cultural evolution, and inspirational future potential", color: "red" },
      { text: "Systematic accomplishments, process improvements, and institutional learning", color: "green" },
      { text: "Relationship appreciation, individual growth, and collective achievements", color: "blue" },
    ],
  },
  {
    id: 49,
    stage: "Adjourning",
    question: "When considering your ultimate leadership legacy, you focus on:",
    options: [
      { text: "Extraordinary organizational results, competitive achievements, and market impact", color: "yellow" },
      { text: "Industry transformation, innovative breakthroughs, and inspirational influence", color: "red" },
      { text: "Enduring institutional systems, operational excellence, and sustainable growth", color: "green" },
      { text: "Leadership development, strengthened communities, and positive human impact", color: "blue" },
    ],
  },
  {
    id: 50,
    stage: "Adjourning",
    question: "When defining your ultimate leadership purpose and contribution, you:",
    options: [
      { text: "Drive exceptional organizational performance and create sustainable competitive advantage", color: "yellow" },
      { text: "Inspire breakthrough change, innovation, and transformational impact across industries", color: "red" },
      { text: "Build excellent, sustainable institutions and systematic organizational capabilities", color: "green" },
      { text: "Serve stakeholders authentically and create lasting positive impact on people and communities", color: "blue" },
    ],
  },
];

const ProAssessment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const purchaseId = searchParams.get('purchase');
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Auto-save hook
  const {
    isLoading: progressLoading,
    savedProgress,
    lastSaved,
    isSaving,
    saveProgress,
    clearProgress,
    markComplete,
    hasProgress,
  } = useAssessmentProgress({
    assessmentType: 'pro',
    totalQuestions: proQuestions.length,
  });

  // Show resume modal if there's saved progress
  useEffect(() => {
    if (!progressLoading && hasProgress && !initialized) {
      setShowResumeModal(true);
    } else if (!progressLoading && !hasProgress) {
      setInitialized(true);
    }
  }, [progressLoading, hasProgress, initialized]);

  // Auto-save on answer changes (debounced)
  useEffect(() => {
    if (!initialized || Object.keys(answers).length === 0) return;
    
    const timer = setTimeout(() => {
      saveProgress(currentQuestion, answers);
    }, 1000); // Debounce 1 second
    
    return () => clearTimeout(timer);
  }, [answers, currentQuestion, initialized, saveProgress]);

  const handleResume = useCallback(() => {
    if (savedProgress) {
      setAnswers(savedProgress.answers);
      setCurrentQuestion(savedProgress.currentQuestion);
      setSelectedAnswer(savedProgress.answers[savedProgress.currentQuestion] || "");
    }
    setShowResumeModal(false);
    setInitialized(true);
  }, [savedProgress]);

  const handleStartFresh = useCallback(async () => {
    await clearProgress();
    setShowResumeModal(false);
    setInitialized(true);
  }, [clearProgress]);

  const handleSaveAndExit = useCallback(async () => {
    await saveProgress(currentQuestion, answers);
  }, [saveProgress, currentQuestion, answers]);

  const consumePurchaseAttempt = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      const { data: rows, error } = await supabase
        .from('assessment_results')
        .select('id, results')
        .eq('user_id', user.id)
        .eq('assessment_type', 'pro')
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error loading purchase placeholders:', error);
        return;
      }

      const targetPurchases = (rows || []).filter((row: any) => {
        const results = row.results as any;
        const isAvailablePurchase = results?.status === 'payment_completed' && results?.assessment_started !== true;
        if (!isAvailablePurchase) {
          return false;
        }
        if (!purchaseId) {
          return true;
        }
        return row.id === purchaseId;
      });

      if (targetPurchases.length === 0) {
        return;
      }

      for (const purchase of targetPurchases) {
        const targetResults = purchase.results as any;
        const { error: updateError } = await supabase
          .from('assessment_results')
          .update({
            results: {
              ...targetResults,
              assessment_started: true,
              started_at: targetResults?.started_at || new Date().toISOString(),
            },
          })
          .eq('id', purchase.id)
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error consuming purchase placeholder:', updateError);
        }
      }
    } catch (error) {
      console.error('Error consuming purchase placeholder:', error);
    }
  }, [user, purchaseId]);

  const handleAnswer = (color: string) => {
    setSelectedAnswer(color);
  };

  // Shuffle options for current question
  const shuffledOptions = useMemo(() => {
    return shuffleArray(proQuestions[currentQuestion].options);
  }, [currentQuestion]);

  // Add keyboard event listener
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Number keys 1-4 for selecting answers
      if (['1', '2', '3', '4'].includes(e.key)) {
        const index = parseInt(e.key) - 1;
        if (index < shuffledOptions.length) {
          handleAnswer(shuffledOptions[index].color);
        }
      }
      
      // Enter key to proceed to next question
      if (e.key === 'Enter' && selectedAnswer) {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedAnswer, shuffledOptions]);

  const handleNext = async () => {
    if (selectedAnswer) {
      const newAnswers = { ...answers, [currentQuestion]: selectedAnswer };
      setAnswers(newAnswers);
      setSelectedAnswer("");

      if (currentQuestion < proQuestions.length - 1) {
        const nextQuestion = currentQuestion + 1;
        setCurrentQuestion(nextQuestion);
        setSelectedAnswer(newAnswers[nextQuestion] || "");
      } else {
        // Calculate advanced results
        const colorCounts = { yellow: 0, red: 0, green: 0, blue: 0 };
        Object.values(newAnswers).forEach((color) => {
          colorCounts[color as keyof typeof colorCounts]++;
        });

        const sortedColors = Object.entries(colorCounts).sort(([,a], [,b]) => b - a);
        const dominantColor = sortedColors[0][0];
        const secondaryColor = sortedColors[1][0];
        const tertiaryColor = sortedColors[2][0];

        // Mark assessment as complete
        await markComplete(dominantColor, colorCounts);
        await consumePurchaseAttempt();

        // Store pro results
        localStorage.setItem('proAssessmentResults', JSON.stringify({
          dominantColor,
          secondaryColor,
          tertiaryColor,
          scores: colorCounts,
          totalQuestions: proQuestions.length,
          isPro: true,
          colorDistribution: sortedColors
        }));

        navigate('/pro-results');
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      const prevQuestion = currentQuestion - 1;
      setCurrentQuestion(prevQuestion);
      setSelectedAnswer(answers[prevQuestion] || "");
    }
  };

  const progress = ((currentQuestion + 1) / proQuestions.length) * 100;
  const currentQuestionData = proQuestions[currentQuestion];

  // Show loading while checking for saved progress
  if (progressLoading) {
    return (
      <ProtectedRoute requiresPayment={true} assessmentType="pro">
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiresPayment={true} assessmentType="pro">
      <div className="min-h-screen bg-background">
        <Navbar />
        
        {/* Resume Progress Modal */}
        <ResumeProgressModal
          open={showResumeModal}
          onResume={handleResume}
          onStartFresh={handleStartFresh}
          answeredCount={Object.keys(savedProgress?.answers || {}).length}
          totalQuestions={proQuestions.length}
          lastSavedAt={lastSaved}
        />

        <div className="bg-gradient-subtle min-h-[calc(100vh-5rem)] pt-24 sm:pt-28 pb-6 sm:pb-8 px-4">
          <div className="max-w-3xl mx-auto min-h-[calc(100vh-12rem)] flex flex-col">
            {/* Header with Progress */}
            <div className="mb-6 sm:mb-8 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-2 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/15 rounded-full flex items-center justify-center shadow-glow flex-shrink-0">
                    <Crown className="text-primary w-4 h-4" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                    Pro Deep Dive Assessment
                  </h1>
                </div>
                <div className="text-left sm:text-right flex flex-col sm:items-end gap-1 w-full sm:w-auto">
                  <div className="text-sm text-muted-foreground">
                    Question {currentQuestion + 1} of {proQuestions.length}
                  </div>
                  <AutoSaveIndicator isSaving={isSaving} lastSaved={lastSaved} />
                </div>
              </div>
              <div className="relative">
                <Progress value={progress} className="h-3 bg-muted/30" />
                <div 
                  className="absolute top-0 left-0 h-3 bg-gradient-brand rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <Card className="shadow-elegant border-2 border-border/20 animate-scale-in">
              <CardHeader className="pb-4 px-4 sm:px-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-3">
                  <div className="w-6 h-6 bg-gradient-hero rounded-full flex items-center justify-center animate-glow-pulse flex-shrink-0">
                    <span className="text-white font-bold text-xs">{currentQuestion + 1}</span>
                  </div>
                  <div className="text-xs text-muted-foreground font-medium tracking-wider uppercase">
                    {currentQuestionData.stage} Stage • Pro Deep Dive
                  </div>
                </div>
                <div className="mb-3">
                  <div className="text-sm font-semibold text-primary mb-1">
                    Team Development: {currentQuestionData.stage}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {currentQuestionData.stage === "Forming" && "Building connection and establishing organizational foundation"}
                    {currentQuestionData.stage === "Storming" && "Navigating complex conflicts and organizational challenges"}
                    {currentQuestionData.stage === "Norming" && "Establishing organizational flow and operational standards"}
                    {currentQuestionData.stage === "Performing" && "Reaching peak organizational productivity and excellence"}
                    {currentQuestionData.stage === "Adjourning" && "Ending with clarity, reflection, and legacy building"}
                  </div>
                </div>
                <CardTitle className="text-lg sm:text-xl leading-relaxed text-foreground">
                  {currentQuestionData.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                <RadioGroup value={selectedAnswer} onValueChange={handleAnswer} className="space-y-3">
                  {shuffledOptions.map((option, index) => (
                    <div 
                      key={index} 
                      className={`flex items-start space-x-3 p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer hover-scale ${
                        selectedAnswer === option.color 
                          ? 'border-primary bg-primary/5 shadow-glow' 
                          : 'border-border/50 hover:border-primary/30 hover:bg-muted/30'
                      }`}
                      onClick={() => handleAnswer(option.color)}
                    >
                      <RadioGroupItem 
                        value={option.color} 
                        id={`option-${index}`}
                        className="mt-0.5 flex-shrink-0"
                      />
                      <Label 
                        htmlFor={`option-${index}`} 
                        className="text-sm leading-relaxed cursor-pointer text-foreground font-medium"
                      >
                        <span className="inline-flex items-center gap-2">
                          <kbd className="hidden sm:inline-flex px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted border border-border rounded">
                            {index + 1}
                          </kbd>
                          {option.text}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 sm:mt-8 animate-fade-in mt-auto pt-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="flex items-center gap-2 w-full sm:w-auto order-2 sm:order-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="text-center flex items-center gap-4 order-3 sm:order-2">
                <PauseButton onSave={handleSaveAndExit} disabled={Object.keys(answers).length === 0} />
                <p className="text-xs text-muted-foreground hidden md:block">
                  Press 1-4 to select • Enter to continue
                </p>
              </div>

              <Button
                onClick={handleNext}
                disabled={!selectedAnswer}
                className="flex items-center gap-2 hover-scale w-full sm:w-auto order-1 sm:order-3"
              >
                {currentQuestion === proQuestions.length - 1 ? 'Get Pro Results' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ProAssessment;