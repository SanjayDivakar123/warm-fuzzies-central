import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navigation/Navbar";
import { 
  leadershipGameScenarios, 
  calculateGameResults,
  type ColorType,
  type GameScenario 
} from "@/lib/leadershipGameScenarios";
import { 
  Gamepad2, 
  ChevronRight, 
  ChevronLeft, 
  BookOpen, 
  Sparkles,
  Users,
  Target,
  Zap,
  Trophy
} from "lucide-react";

const chapterIcons: Record<string, React.ReactNode> = {
  "Chapter 1: The New Team": <Users className="w-5 h-5" />,
  "Chapter 2: Growing Pains": <Zap className="w-5 h-5" />,
  "Chapter 3: Finding Our Rhythm": <Target className="w-5 h-5" />,
  "Chapter 4: Peak Performance": <Trophy className="w-5 h-5" />,
  "Chapter 5: Evolution": <Sparkles className="w-5 h-5" />,
};

const colorStyles: Record<ColorType, string> = {
  Yellow: "border-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20",
  Red: "border-red-400 bg-red-400/10 hover:bg-red-400/20",
  Green: "border-green-400 bg-green-400/10 hover:bg-green-400/20",
  Blue: "border-blue-400 bg-blue-400/10 hover:bg-blue-400/20",
};

export default function LeadershipGame() {
  const navigate = useNavigate();
  const [currentScenario, setCurrentScenario] = useState(0);
  const [choices, setChoices] = useState<Record<number, ColorType>>({});
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [showOutcome, setShowOutcome] = useState(false);
  const [shuffledChoices, setShuffledChoices] = useState<typeof leadershipGameScenarios[0]["choices"]>([]);
  const [isStarted, setIsStarted] = useState(false);
  
  const scenario = leadershipGameScenarios[currentScenario];
  const progress = ((currentScenario + 1) / leadershipGameScenarios.length) * 100;
  const isLastScenario = currentScenario === leadershipGameScenarios.length - 1;
  
  // Shuffle choices when scenario changes
  useEffect(() => {
    if (scenario) {
      const shuffled = [...scenario.choices].sort(() => Math.random() - 0.5);
      setShuffledChoices(shuffled);
    }
  }, [currentScenario]);
  
  const handleChoiceSelect = (index: number) => {
    if (showOutcome) return;
    setSelectedChoice(index);
  };
  
  const handleConfirmChoice = () => {
    if (selectedChoice === null) return;
    
    const choice = shuffledChoices[selectedChoice];
    setChoices(prev => ({ ...prev, [scenario.id]: choice.color }));
    setShowOutcome(true);
  };
  
  const handleContinue = () => {
    if (isLastScenario) {
      // Calculate and save results
      const results = calculateGameResults(choices);
      localStorage.setItem("leadershipGameResults", JSON.stringify(results));
      localStorage.setItem("assessmentType", "game");
      navigate("/leadership-results");
    } else {
      setCurrentScenario(prev => prev + 1);
      setSelectedChoice(null);
      setShowOutcome(false);
    }
  };
  
  const handleBack = () => {
    if (currentScenario > 0) {
      setCurrentScenario(prev => prev - 1);
      setSelectedChoice(null);
      setShowOutcome(false);
    }
  };
  
  if (!isStarted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-4xl mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-8">
              <Gamepad2 className="w-10 h-10 text-primary" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Leadership <span className="gradient-text-primary">Adventure</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Step into the role of a team leader. Navigate through 15 real-world scenarios 
              across 5 chapters of team development. Your choices will reveal your unique leadership style.
            </p>
            
            <div className="grid md:grid-cols-5 gap-4 mb-12">
              {Object.entries(chapterIcons).map(([chapter, icon]) => (
                <Card key={chapter} className="p-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                      {icon}
                    </div>
                    <span className="text-sm font-medium text-center">
                      {chapter.replace("Chapter ", "Ch").replace(": ", "\n")}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="bg-muted/50 rounded-lg p-6 mb-8 max-w-xl mx-auto">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                How It Works
              </h3>
              <ul className="text-left text-muted-foreground space-y-2">
                <li>• Read each scenario and situation carefully</li>
                <li>• Choose the response that feels most natural to you</li>
                <li>• See the outcome of your decision</li>
                <li>• Get the same detailed report as our 50-question assessment</li>
              </ul>
            </div>
            
            <Button 
              size="lg" 
              className="text-lg px-8"
              onClick={() => setIsStarted(true)}
            >
              Begin Your Adventure
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary" className="text-sm">
              {chapterIcons[scenario.chapter]}
              <span className="ml-2">{scenario.chapter}</span>
            </Badge>
            <span className="text-sm text-muted-foreground">
              Scenario {currentScenario + 1} of {leadershipGameScenarios.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScenario}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Scenario Card */}
            <Card className="mb-6 overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 border-b">
                <h2 className="text-2xl font-bold mb-2">{scenario.title}</h2>
                <p className="text-muted-foreground">{scenario.narrative}</p>
              </div>
              
              <CardContent className="p-6">
                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <p className="font-medium text-lg">{scenario.situation}</p>
                </div>
                
                {/* Choices */}
                <div className="space-y-3">
                  {shuffledChoices.map((choice, index) => (
                    <motion.button
                      key={index}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        selectedChoice === index
                          ? colorStyles[choice.color]
                          : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
                      } ${showOutcome && selectedChoice !== index ? "opacity-50" : ""}`}
                      onClick={() => handleChoiceSelect(index)}
                      disabled={showOutcome}
                      whileHover={{ scale: showOutcome ? 1 : 1.01 }}
                      whileTap={{ scale: showOutcome ? 1 : 0.99 }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center font-semibold">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="pt-1">{choice.text}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
                
                {/* Outcome */}
                <AnimatePresence>
                  {showOutcome && selectedChoice !== null && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6"
                    >
                      <div className={`p-4 rounded-lg border-2 ${colorStyles[shuffledChoices[selectedChoice].color]}`}>
                        <div className="flex items-start gap-3">
                          <Sparkles className="w-5 h-5 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium mb-1">Outcome:</p>
                            <p className="text-muted-foreground">
                              {shuffledChoices[selectedChoice].outcome}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
            
            {/* Navigation */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentScenario === 0}
              >
                <ChevronLeft className="mr-2 w-4 h-4" />
                Back
              </Button>
              
              {!showOutcome ? (
                <Button
                  onClick={handleConfirmChoice}
                  disabled={selectedChoice === null}
                >
                  Confirm Choice
                  <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleContinue}>
                  {isLastScenario ? (
                    <>
                      See Your Results
                      <Trophy className="ml-2 w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
