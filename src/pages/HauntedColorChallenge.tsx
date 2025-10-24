import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/navigation/Navbar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, Skull, Ghost, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PumpkinChallenge {
  color: 'red' | 'yellow' | 'green' | 'blue';
  timeLeft: number;
}

export default function HauntedColorChallenge() {
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [currentPumpkin, setCurrentPumpkin] = useState<PumpkinChallenge | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  const WINNING_SCORE = 50; // Challenging but achievable!
  const CHALLENGE_TIME = 3; // 3 seconds to click
  const colors = ['red', 'yellow', 'green', 'blue'] as const;
  const emojis = { red: '🎃', yellow: '🎃', green: '🎃', blue: '🎃' };

  const spawnNewPumpkin = () => {
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    setCurrentPumpkin({
      color: randomColor,
      timeLeft: CHALLENGE_TIME,
    });
  };

  useEffect(() => {
    if (!gameStarted || gameOver || won || currentPumpkin) return;
    
    // Spawn a new pumpkin after a short delay
    const spawnDelay = setTimeout(() => {
      spawnNewPumpkin();
    }, 800);

    return () => clearTimeout(spawnDelay);
  }, [gameStarted, gameOver, won, currentPumpkin]);

  useEffect(() => {
    if (!currentPumpkin || !gameStarted) return;

    // Countdown timer
    timerRef.current = setInterval(() => {
      setCurrentPumpkin(prev => {
        if (!prev) return null;
        
        const newTimeLeft = prev.timeLeft - 0.1;
        
        if (newTimeLeft <= 0) {
          // Time's up! Lose a life
          setLives(l => Math.max(l - 1, 0));
          toast({
            title: "Too Slow! 💀",
            description: "The pumpkin vanished!",
            variant: "destructive",
          });
          return null;
        }
        
        return { ...prev, timeLeft: newTimeLeft };
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentPumpkin, gameStarted]);

  useEffect(() => {
    if (lives <= 0) {
      setGameOver(true);
      setGameStarted(false);
    }
  }, [lives]);

  useEffect(() => {
    if (score >= WINNING_SCORE) {
      setWon(true);
      setGameStarted(false);
      // Trigger confetti
      // @ts-ignore
      if (window.confetti) {
        const duration = 5 * 1000;
        const end = Date.now() + duration;
        const colors = ['#FF7518', '#6D28D9', '#8B5CF6', '#27bd73', '#fd3'];
        
        (function frame() {
          // @ts-ignore
          window.confetti({
            particleCount: 7,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors
          });
          // @ts-ignore
          window.confetti({
            particleCount: 7,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        }());
      }
    }
  }, [score]);


  const handleColorClick = (targetColor: typeof colors[number]) => {
    if (!gameStarted || gameOver || won || !currentPumpkin) return;

    if (currentPumpkin.color === targetColor) {
      // Correct! Add point
      setScore(s => s + 1);
      setCurrentPumpkin(null);
      toast({
        title: "Perfect! 🎃",
        description: "+1 point!",
      });
    } else {
      // Wrong color! Lose a life
      setLives(l => Math.max(l - 1, 0));
      setCurrentPumpkin(null);
      toast({
        title: "Wrong Color! 👻",
        description: "Try again!",
        variant: "destructive",
      });
    }
  };

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setWon(false);
    setScore(0);
    setLives(5);
    setCurrentPumpkin(null);
  };

  const copyCode = () => {
    navigator.clipboard.writeText('WONIT25');
    toast({
      title: "Code Copied! 🎃",
      description: "WONIT25 has been copied to your clipboard!",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container-wide section-padding">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black mb-4 gradient-text-primary">
            🎃 The Haunted Color Gauntlet 💀
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            Click the matching color within 3 seconds!
          </p>
          <p className="text-lg text-destructive font-bold">
            ⚠️ Reach {WINNING_SCORE} points to unlock the ultimate prize! ⚠️
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Fast reflexes needed! Can you beat the clock? ⚡
          </p>
        </div>

        {/* Game Stats */}
        <div className="flex justify-center gap-8 mb-8">
          <Card className="px-6 py-4 glass-card-strong border-primary">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Score</p>
              <p className="text-3xl font-bold text-primary">{score}/{WINNING_SCORE}</p>
            </div>
          </Card>
          <Card className="px-6 py-4 glass-card-strong border-destructive">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Lives</p>
              <p className="text-3xl font-bold text-destructive">
                {'💀'.repeat(lives)}
              </p>
            </div>
          </Card>
          <Card className="px-6 py-4 glass-card-strong border-yellow">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Timer</p>
              <p className="text-3xl font-bold text-yellow">
                {currentPumpkin ? `${currentPumpkin.timeLeft.toFixed(1)}s` : '---'}
              </p>
            </div>
          </Card>
        </div>

        {/* Game Area */}
        <div className="max-w-4xl mx-auto">
          <Card className="relative h-[600px] overflow-hidden bg-gradient-to-b from-[#1a0a2e] to-[#0a0a0a] border-4 border-primary shadow-glow">
            {/* Flashing Pumpkin */}
            {currentPumpkin && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className={`text-[200px] animate-pulse transition-all duration-200 ${
                    currentPumpkin.timeLeft < 1 ? 'animate-bounce' : ''
                  }`}
                  style={{
                    filter: `drop-shadow(0 0 30px ${
                      currentPumpkin.color === 'red' ? '#ef4444' :
                      currentPumpkin.color === 'yellow' ? '#eab308' :
                      currentPumpkin.color === 'green' ? '#22c55e' :
                      '#3b82f6'
                    })`,
                    color: currentPumpkin.color === 'red' ? '#ef4444' :
                           currentPumpkin.color === 'yellow' ? '#eab308' :
                           currentPumpkin.color === 'green' ? '#22c55e' :
                           '#3b82f6'
                  }}
                >
                  🎃
                </div>
              </div>
            )}

            {/* Catch Zones */}
            <div className="absolute bottom-0 w-full h-32 grid grid-cols-4 gap-2 p-4 bg-black/50 backdrop-blur-sm border-t-4 border-primary">
              {colors.map(color => (
                <button
                  key={color}
                  onClick={() => handleColorClick(color)}
                  disabled={!gameStarted || gameOver || won}
                  className={`rounded-xl border-4 font-bold text-white text-lg transition-all hover:scale-105 active:scale-95 shadow-${color} hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-${color}`}
                >
                  {emojis[color]}<br />{color.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Overlay Messages */}
            {!gameStarted && !won && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                <div className="text-center space-y-6">
                  <Ghost className="w-32 h-32 mx-auto text-primary animate-bounce" />
                  <h2 className="text-4xl font-bold text-white">
                    {gameOver ? '💀 Game Over! 💀' : 'Ready to Face the Gauntlet?'}
                  </h2>
                  {gameOver && (
                    <p className="text-xl text-muted-foreground">
                      You scored {score}/{WINNING_SCORE}
                    </p>
                  )}
                  <Button 
                    size="lg" 
                    onClick={startGame}
                    className="text-xl px-12 py-6 bg-gradient-primary hover:scale-110 transition-transform"
                  >
                    <Skull className="mr-2" />
                    {gameOver ? 'Try Again' : 'Start Challenge'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Instructions */}
        <Card className="max-w-4xl mx-auto mt-8 p-6 glass-card-strong">
          <h3 className="text-2xl font-bold mb-4 text-primary">How to Play:</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>🎃 <strong>Watch the pumpkin</strong> flash in different colors!</li>
            <li>⚡ <strong>React fast!</strong> You have 3 seconds to click the matching color</li>
            <li>💀 <strong>Wrong color or too slow?</strong> You lose a life!</li>
            <li>👻 <strong>Stay focused</strong> - the colors change randomly</li>
            <li>🏆 <strong>Reach {WINNING_SCORE} points</strong> to unlock the ultimate prize!</li>
          </ul>
        </Card>
      </div>

      {/* Victory Dialog */}
      <Dialog open={won} onOpenChange={setWon}>
        <DialogContent className="sm:max-w-md glass-card-strong border-4 border-yellow">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-3xl">
              🏆 LEGENDARY ACHIEVEMENT! 🏆
            </DialogTitle>
            <DialogDescription className="text-lg">
              You've conquered the impossible! You are a true Color Master!
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-gradient-primary p-8 rounded-lg text-center space-y-4">
            <p className="text-white text-2xl font-bold animate-pulse">
              🎉 YOUR PRIZE CODE 🎉
            </p>
            <div className="bg-white/20 backdrop-blur-sm border-4 border-yellow rounded-lg p-6">
              <p className="text-white text-4xl font-black tracking-widest">
                WONIT25
              </p>
            </div>
            <p className="text-white/90 text-base">
              Use this code for a <span className="font-black text-yellow text-xl">FREE ASSESSMENT</span>!<br />
              You earned it, Champion! 🎃
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={copyCode} className="flex-1 gap-2 bg-gradient-yellow">
              <Copy className="w-4 h-4" />
              Copy Victory Code
            </Button>
            <Button onClick={() => setWon(false)} variant="outline" className="flex-1">
              Play Again!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
