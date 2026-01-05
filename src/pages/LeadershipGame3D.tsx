import { useState, useCallback, Suspense, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navigation/Navbar";
import OfficeScene from "@/components/game/OfficeScene";
import PlayerController from "@/components/game/PlayerController";
import GameUI from "@/components/game/GameUI";
import { 
  leadershipGameScenarios, 
  calculateGameResults,
  type ColorType,
  type GameScenario 
} from "@/lib/leadershipGameScenarios";
import { Gamepad2, ChevronRight, Loader2 } from "lucide-react";

// Define NPCs with positions in the office
const officeNPCs = [
  { id: 1, name: "Alex", position: [-8, 0, -6] as [number, number, number], color: "#4299E1" },
  { id: 2, name: "Jordan", position: [-4, 0, -6] as [number, number, number], color: "#48BB78" },
  { id: 3, name: "Sam", position: [0, 0, -6] as [number, number, number], color: "#ECC94B" },
  { id: 4, name: "Taylor", position: [4, 0, -6] as [number, number, number], color: "#F56565" },
  { id: 5, name: "Casey", position: [-8, 0, -3] as [number, number, number], color: "#9F7AEA" },
  { id: 6, name: "Morgan", position: [-4, 0, -3] as [number, number, number], color: "#ED8936" },
  { id: 7, name: "Riley", position: [8, 0, -1] as [number, number, number], color: "#38B2AC" },
  { id: 8, name: "Quinn", position: [8, 0, 1] as [number, number, number], color: "#E53E3E" },
  { id: 9, name: "Blake", position: [-10, 0, 7] as [number, number, number], color: "#667EEA" },
];

// Map NPCs to scenarios (some NPCs can have multiple scenarios)
const npcScenarioMap: Record<number, number[]> = {
  1: [1, 2],      // Alex - scenarios 1, 2
  2: [3, 4],      // Jordan - scenarios 3, 4
  3: [5, 6],      // Sam - scenarios 5, 6
  4: [7, 8],      // Taylor - scenarios 7, 8
  5: [9, 10],     // Casey - scenarios 9, 10
  6: [11, 12],    // Morgan - scenarios 11, 12
  7: [13],        // Riley - scenario 13
  8: [14],        // Quinn - scenario 14
  9: [15],        // Blake - scenario 15
};

export default function LeadershipGame3D() {
  const navigate = useNavigate();
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeNPC, setActiveNPC] = useState<number | null>(null);
  const [currentScenario, setCurrentScenario] = useState<GameScenario | null>(null);
  const [choices, setChoices] = useState<Record<number, ColorType>>({});
  const [completedScenarios, setCompletedScenarios] = useState<Set<number>>(new Set());
  const [showOutcome, setShowOutcome] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [hoveredNPC, setHoveredNPC] = useState<string | null>(null);

  // Get next available scenario for an NPC
  const getNextScenarioForNPC = useCallback((npcId: number): GameScenario | null => {
    const scenarioIds = npcScenarioMap[npcId] || [];
    for (const id of scenarioIds) {
      if (!completedScenarios.has(id)) {
        return leadershipGameScenarios.find(s => s.id === id) || null;
      }
    }
    return null;
  }, [completedScenarios]);

  // Handle NPC click
  const handleNPCClick = useCallback((npcId: number) => {
    const scenario = getNextScenarioForNPC(npcId);
    if (scenario) {
      setActiveNPC(npcId);
      setCurrentScenario(scenario);
      setShowOutcome(false);
      setSelectedOutcome(null);
      document.exitPointerLock();
    }
  }, [getNextScenarioForNPC]);

  // Handle choice selection
  const handleChoiceSelect = useCallback((choice: { text: string; color: ColorType; outcome: string }) => {
    if (!currentScenario) return;
    
    setChoices(prev => ({ ...prev, [currentScenario.id]: choice.color }));
    setSelectedOutcome(choice.outcome);
    setShowOutcome(true);
  }, [currentScenario]);

  // Handle continue after outcome
  const handleContinue = useCallback(() => {
    if (!currentScenario) return;
    
    setCompletedScenarios(prev => new Set([...prev, currentScenario.id]));
    setCurrentScenario(null);
    setActiveNPC(null);
    setShowOutcome(false);
    setSelectedOutcome(null);

    // Check if all scenarios completed
    if (completedScenarios.size + 1 >= leadershipGameScenarios.length) {
      const results = calculateGameResults({ ...choices, [currentScenario.id]: choices[currentScenario.id] || "Yellow" });
      localStorage.setItem("leadershipGameResults", JSON.stringify(results));
      localStorage.setItem("assessmentType", "game");
      navigate("/leadership-results");
    }
  }, [currentScenario, completedScenarios.size, choices, navigate]);

  // Handle dialog close
  const handleCloseDialog = useCallback(() => {
    if (!showOutcome) {
      setCurrentScenario(null);
      setActiveNPC(null);
    }
  }, [showOutcome]);

  // Check for game completion
  useEffect(() => {
    if (completedScenarios.size >= leadershipGameScenarios.length && Object.keys(choices).length >= leadershipGameScenarios.length) {
      const results = calculateGameResults(choices);
      localStorage.setItem("leadershipGameResults", JSON.stringify(results));
      localStorage.setItem("assessmentType", "game");
      navigate("/leadership-results");
    }
  }, [completedScenarios.size, choices, navigate]);

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
              3D Office <span className="gradient-text-primary">Leadership Simulation</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Walk around a 3D office, interact with your team members, and navigate through 
              leadership challenges. Your decisions will reveal your unique leadership style.
            </p>

            <Card className="max-w-xl mx-auto mb-8">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 text-lg">How to Play</h3>
                <div className="grid grid-cols-2 gap-4 text-left text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">W A S D</Badge>
                    <span>Move around</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Mouse</Badge>
                    <span>Look around</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Click</Badge>
                    <span>Talk to NPCs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">ESC</Badge>
                    <span>Release mouse</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-8"
                onClick={() => setIsStarted(true)}
              >
                Enter the Office
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/leadership-game")}
              >
                Play Text Version Instead
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-background flex flex-col items-center justify-center"
          >
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Loading office environment...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ fov: 75, near: 0.1, far: 1000 }}
        onCreated={() => setTimeout(() => setIsLoading(false), 1000)}
      >
        <Suspense fallback={null}>
          <fog attach="fog" args={["#1a1a2e", 10, 50]} />
          <OfficeScene
            npcs={officeNPCs.map(npc => ({
              ...npc,
              // Highlight NPCs with available scenarios
              color: getNextScenarioForNPC(npc.id) ? npc.color : "#666666"
            }))}
            activeNPC={activeNPC}
            onNPCClick={handleNPCClick}
          />
          <PlayerController speed={4} />
        </Suspense>
      </Canvas>

      {/* Game UI Overlay */}
      <GameUI
        scenario={currentScenario}
        npcName={hoveredNPC}
        onChoiceSelect={handleChoiceSelect}
        onClose={handleCloseDialog}
        completedCount={completedScenarios.size}
        totalCount={leadershipGameScenarios.length}
        showOutcome={showOutcome}
        selectedOutcome={selectedOutcome}
        onContinue={handleContinue}
      />

      {/* Exit button */}
      <div className="absolute top-4 left-4 z-40">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            document.exitPointerLock();
            navigate("/");
          }}
          className="bg-background/80 backdrop-blur-sm"
        >
          Exit Game
        </Button>
      </div>
    </div>
  );
}
