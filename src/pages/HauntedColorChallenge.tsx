import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/navigation/Navbar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, Skull, Ghost, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FallingObject {
  id: number;
  color: 'red' | 'yellow' | 'green' | 'blue';
  x: number;
  y: number;
  speed: number;
}

export default function HauntedColorChallenge() {
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [objects, setObjects] = useState<FallingObject[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [speed, setSpeed] = useState(2);
  const gameLoopRef = useRef<number>();
  const nextIdRef = useRef(0);

  const WINNING_SCORE = 66; // Spooky number and nearly impossible!
  const colors = ['red', 'yellow', 'green', 'blue'] as const;
  const emojis = { red: '🎃', yellow: '⚡', green: '👻', blue: '💀' };

  useEffect(() => {
    if (!gameStarted || gameOver || won) return;

    const spawnInterval = setInterval(() => {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const newObject: FallingObject = {
        id: nextIdRef.current++,
        color: randomColor,
        x: Math.random() * 80 + 10,
        y: -10,
        speed: speed + Math.random() * 2,
      };
      setObjects(prev => [...prev, newObject]);
    }, Math.max(800 - score * 10, 300)); // Spawn faster as score increases

    return () => clearInterval(spawnInterval);
  }, [gameStarted, gameOver, won, score, speed]);

  useEffect(() => {
    if (!gameStarted || gameOver || won) return;

    const gameLoop = () => {
      setObjects(prev => {
        const updated = prev.map(obj => ({
          ...obj,
          y: obj.y + obj.speed,
        }));

        // Remove objects that reached bottom and reduce lives
        const filtered = updated.filter(obj => {
          if (obj.y > 100) {
            setLives(l => l - 1);
            return false;
          }
          return true;
        });

        return filtered;
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameStarted, gameOver, won]);

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

  useEffect(() => {
    // Speed increases every 10 points
    if (score > 0 && score % 10 === 0) {
      setSpeed(s => Math.min(s + 0.5, 8));
    }
  }, [score]);

  const handleColorClick = (targetColor: typeof colors[number]) => {
    if (!gameStarted || gameOver || won) return;

    setObjects(prev => {
      let caught = false;
      const filtered = prev.filter(obj => {
        if (!caught && obj.color === targetColor && obj.y > 60 && obj.y < 95) {
          caught = true;
          setScore(s => s + 1);
          return false;
        }
        return true;
      });

      if (!caught) {
        setLives(l => Math.max(l - 1, 0));
        toast({
          title: "Miss! 👻",
          description: "Wrong timing or color!",
          variant: "destructive",
        });
      }

      return filtered;
    });
  };

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setWon(false);
    setScore(0);
    setLives(3);
    setObjects([]);
    setSpeed(2);
    nextIdRef.current = 0;
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
            Catch falling spirits in their matching color zones!
          </p>
          <p className="text-lg text-destructive font-bold">
            ⚠️ Reach {WINNING_SCORE} points to unlock the ultimate prize! ⚠️
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            (Legend says it's impossible... prove them wrong! 👻)
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
              <p className="text-sm text-muted-foreground">Speed</p>
              <p className="text-3xl font-bold text-yellow">
                <Zap className="w-8 h-8 inline" />
              </p>
            </div>
          </Card>
        </div>

        {/* Game Area */}
        <div className="max-w-4xl mx-auto">
          <Card className="relative h-[600px] overflow-hidden bg-gradient-to-b from-[#1a0a2e] to-[#0a0a0a] border-4 border-primary shadow-glow">
            {/* Falling Objects */}
            {objects.map(obj => (
              <div
                key={obj.id}
                className="absolute text-6xl animate-pulse transition-all"
                style={{
                  left: `${obj.x}%`,
                  top: `${obj.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {emojis[obj.color]}
              </div>
            ))}

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
            <li>🎃 <strong>Catch</strong> falling spirits by clicking their matching color zone</li>
            <li>⚡ <strong>Timing is everything</strong> - click when spirits reach the bottom zone</li>
            <li>💀 <strong>Miss or wrong color?</strong> You lose a life!</li>
            <li>👻 <strong>Speed increases</strong> every 10 points - can you keep up?</li>
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
