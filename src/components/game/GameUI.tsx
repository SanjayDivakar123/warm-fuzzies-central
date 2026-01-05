import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { X, MessageCircle, Sparkles } from "lucide-react";
import type { ColorType } from "@/lib/leadershipGameScenarios";

interface GameChoice {
  text: string;
  color: ColorType;
  outcome: string;
}

interface GameScenario {
  id: number;
  chapter: string;
  title: string;
  narrative: string;
  situation: string;
  choices: GameChoice[];
}

interface GameUIProps {
  scenario: GameScenario | null;
  npcName: string | null;
  onChoiceSelect: (choice: GameChoice) => void;
  onClose: () => void;
  completedCount: number;
  totalCount: number;
  showOutcome: boolean;
  selectedOutcome: string | null;
  onContinue: () => void;
}

const colorStyles: Record<ColorType, string> = {
  Yellow: "border-yellow-400 bg-yellow-400/20 hover:bg-yellow-400/30",
  Red: "border-red-400 bg-red-400/20 hover:bg-red-400/30",
  Green: "border-green-400 bg-green-400/20 hover:bg-green-400/30",
  Blue: "border-blue-400 bg-blue-400/20 hover:bg-blue-400/30",
};

export default function GameUI({
  scenario,
  npcName,
  onChoiceSelect,
  onClose,
  completedCount,
  totalCount,
  showOutcome,
  selectedOutcome,
  onContinue,
}: GameUIProps) {
  const progress = (completedCount / totalCount) * 100;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* HUD - Top Bar */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-auto">
        <Card className="bg-background/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-sm">
                <MessageCircle className="w-4 h-4 mr-2" />
                Scenarios: {completedCount}/{totalCount}
              </Badge>
              <div className="w-32">
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {!scenario && (
          <Card className="bg-background/80 backdrop-blur-sm max-w-xs">
            <CardContent className="p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Controls:</p>
              <p>WASD / Arrows - Move</p>
              <p>Mouse - Look around</p>
              <p>Click on NPCs to interact</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Crosshair */}
      {!scenario && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-1 h-1 bg-white rounded-full opacity-50" />
        </div>
      )}

      {/* Interaction Prompt */}
      {npcName && !scenario && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-32 left-1/2 -translate-x-1/2 pointer-events-auto"
        >
          <Card className="bg-background/90 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <p className="font-medium">Click to talk to {npcName}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Scenario Dialog */}
      <AnimatePresence>
        {scenario && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            >
              <Card className="bg-background/95 backdrop-blur-sm">
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <Badge variant="secondary" className="mb-2">
                        {scenario.chapter}
                      </Badge>
                      <h2 className="text-2xl font-bold">{scenario.title}</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Narrative */}
                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <p className="text-muted-foreground">{scenario.narrative}</p>
                  </div>

                  {/* Situation */}
                  <div className="bg-primary/10 rounded-lg p-4 mb-6">
                    <p className="font-medium">{scenario.situation}</p>
                  </div>

                  {/* Outcome */}
                  <AnimatePresence>
                    {showOutcome && selectedOutcome && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6"
                      >
                        <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg p-4 border border-primary/30">
                          <div className="flex items-start gap-3">
                            <Sparkles className="w-5 h-5 mt-0.5 flex-shrink-0 text-primary" />
                            <div>
                              <p className="font-medium mb-1 text-primary">Outcome:</p>
                              <p className="text-foreground">{selectedOutcome}</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 text-center">
                          <Button onClick={onContinue}>Continue Exploring</Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Choices */}
                  {!showOutcome && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground mb-3">Choose your response:</p>
                      {scenario.choices.map((choice, index) => (
                        <motion.button
                          key={index}
                          className={`w-full p-4 rounded-lg border-2 text-left transition-all ${colorStyles[choice.color]}`}
                          onClick={() => onChoiceSelect(choice)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-background/50 flex items-center justify-center font-semibold">
                              {String.fromCharCode(65 + index)}
                            </span>
                            <span className="pt-1">{choice.text}</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions overlay when starting */}
      {completedCount === 0 && !scenario && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-white text-lg font-medium drop-shadow-lg"
          >
            Click to enable mouse look, then explore the office
          </motion.p>
        </div>
      )}
    </div>
  );
}
