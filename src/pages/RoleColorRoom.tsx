import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/navigation/Navbar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, Lock, Key, Skull, Ghost, Timer } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Puzzle {
  id: number;
  solved: boolean;
  type: 'color-sequence' | 'color-match' | 'color-code';
}

export default function RoleColorRoom() {
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes - much harder!
  const [currentPuzzle, setCurrentPuzzle] = useState(1);
  const [puzzles, setPuzzles] = useState<Puzzle[]>([
    { id: 1, solved: false, type: 'color-sequence' },
    { id: 2, solved: false, type: 'color-match' },
    { id: 3, solved: false, type: 'color-code' },
    { id: 4, solved: false, type: 'color-sequence' },
  ]);
  const [escaped, setEscaped] = useState(false);
  const [failed, setFailed] = useState(false);
  
  // Puzzle 1: Color Sequence Memory
  const [sequence, setSequence] = useState<string[]>([]);
  const [userSequence, setUserSequence] = useState<string[]>([]);
  const [showSequence, setShowSequence] = useState(false);
  
  // Puzzle 2: Color Matching
  const [colorPairs, setColorPairs] = useState<{color: string, revealed: boolean}[]>([]);
  const [selectedPair, setSelectedPair] = useState<number[]>([]);
  const [pairLock, setPairLock] = useState(false);
  
  // Puzzle 3: Color Code Lock
  const [codeLock, setCodeLock] = useState<string[]>(['', '', '', '']);
  const correctCode = ['red', 'green', 'blue', 'yellow'];

  const colors = ['red', 'yellow', 'green', 'blue', 'purple', 'orange'];

  useEffect(() => {
    if (!gameStarted || failed || escaped) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setFailed(true);
          setGameStarted(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, failed, escaped]);

  useEffect(() => {
    if (puzzles.every(p => p.solved) && gameStarted) {
      setEscaped(true);
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
  }, [puzzles, gameStarted]);

  const startGame = () => {
    setGameStarted(true);
    setFailed(false);
    setEscaped(false);
    setTimeLeft(180); // 3 minutes
    setCurrentPuzzle(1);
    setPuzzles([
      { id: 1, solved: false, type: 'color-sequence' },
      { id: 2, solved: false, type: 'color-match' },
      { id: 3, solved: false, type: 'color-code' },
      { id: 4, solved: false, type: 'color-sequence' },
    ]);
    setUserSequence([]);
    setCodeLock(['', '', '', '']);
    
    // Initialize Puzzle 1: Longer random sequence (7 colors!)
    const randomSeq = Array.from({ length: 7 }, () => 
      colors[Math.floor(Math.random() * 6)]
    );
    setSequence(randomSeq);
    
    // Initialize Puzzle 2: More pairs (12 cards!)
    const pairColors = ['red', 'red', 'blue', 'blue', 'green', 'green', 'yellow', 'yellow', 'purple', 'purple', 'orange', 'orange'];
    const shuffled = pairColors.sort(() => Math.random() - 0.5);
    setColorPairs(shuffled.map(color => ({ color, revealed: false })));
    setSelectedPair([]);
  };

  const showSequencePuzzle = () => {
    setShowSequence(true);
    setTimeout(() => setShowSequence(false), 2000); // Only 2 seconds to memorize!
  };

  const handleSequenceClick = (color: string) => {
    if (!gameStarted || puzzles[0].solved) return;
    
    const newUserSeq = [...userSequence, color];
    setUserSequence(newUserSeq);

    if (newUserSeq.length === sequence.length) {
      if (JSON.stringify(newUserSeq) === JSON.stringify(sequence)) {
        setPuzzles(prev => prev.map(p => p.id === 1 ? { ...p, solved: true } : p));
        setCurrentPuzzle(2);
        toast({
          title: "Puzzle 1 Solved! 🎃",
          description: "Memory perfect! Moving to next puzzle...",
        });
      } else {
        setUserSequence([]);
        toast({
          title: "Wrong Sequence! 👻",
          description: "Try again!",
          variant: "destructive",
        });
      }
    }
  };

  const handlePairClick = (index: number) => {
    if (!gameStarted || currentPuzzle < 2 || puzzles[1].solved || pairLock || colorPairs[index].revealed) return;

    if (selectedPair.length === 0) {
      setSelectedPair([index]);
      setColorPairs(prev => prev.map((p, i) => i === index ? { ...p, revealed: true } : p));
      return;
    }

    if (selectedPair.length === 1 && selectedPair[0] !== index) {
      const firstIndex = selectedPair[0];
      setPairLock(true);

      // Reveal the second card immediately using a snapshot
      const nextPairs = colorPairs.map((p, i) => i === index ? { ...p, revealed: true } : p);
      const isMatch = nextPairs[firstIndex].color === nextPairs[index].color;
      setColorPairs(nextPairs);

      if (isMatch) {
        toast({ title: "Match Found! 🎃", description: "Keep going!" });
        setSelectedPair([]);
        setPairLock(false);

        // Check completion based on the updated snapshot
        const allRevealed = nextPairs.every(p => p.revealed);
        if (allRevealed) {
          setPuzzles(p => p.map(puzzle => puzzle.id === 2 ? { ...puzzle, solved: true } : puzzle));
          setCurrentPuzzle(3);
          toast({ title: "Puzzle 2 Solved! 🎃", description: "All pairs matched! Next puzzle awaits..." });
        }
      } else {
        // Hide both after a short delay
        setTimeout(() => {
          setColorPairs(prev => prev.map((p, i) => (i === firstIndex || i === index) ? { ...p, revealed: false } : p));
          setSelectedPair([]);
          setPairLock(false);
        }, 600);
      }
    }
  };

  const handleCodeChange = (index: number, color: string) => {
    if (!gameStarted || puzzles[2].solved) return;
    
    const newCode = [...codeLock];
    newCode[index] = color;
    setCodeLock(newCode);
    
    if (newCode.every(c => c !== '')) {
      if (JSON.stringify(newCode) === JSON.stringify(correctCode)) {
        setPuzzles(prev => prev.map(p => p.id === 3 ? { ...p, solved: true } : p));
        setCurrentPuzzle(4);
        toast({
          title: "DOOR UNLOCKED! 🔓",
          description: "Final challenge unlocked!",
        });
      } else {
        setTimeout(() => {
          setCodeLock(['', '', '', '']);
          toast({
            title: "Wrong Code! 🔒",
            description: "The door remains locked...",
            variant: "destructive",
          });
        }, 500);
      }
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText('ESCAPED25');
    toast({
      title: "Code Copied! 🎃",
      description: "ESCAPED25 has been copied to your clipboard!",
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container-wide section-padding">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black mb-4 gradient-text-primary">
            🎃 The RoleColor Escape Room 💀
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            Solve 3 color puzzles to escape before time runs out!
          </p>
          <p className="text-lg text-destructive font-bold">
            ⚠️ Complete all puzzles to win a FREE assessment code! ⚠️
          </p>
        </div>

        {/* Game Stats */}
        <div className="flex justify-center gap-8 mb-8">
          <Card className="px-6 py-4 glass-card-strong border-primary">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Time Left</p>
              <p className="text-3xl font-bold text-primary flex items-center gap-2">
                <Timer className="w-8 h-8" />
                {formatTime(timeLeft)}
              </p>
            </div>
          </Card>
          <Card className="px-6 py-4 glass-card-strong border-green">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Puzzles Solved</p>
              <p className="text-3xl font-bold text-green">
                {puzzles.filter(p => p.solved).length}/4
              </p>
            </div>
          </Card>
          <Card className="px-6 py-4 glass-card-strong border-yellow">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Current Puzzle</p>
              <p className="text-3xl font-bold text-yellow">
                #{currentPuzzle}
              </p>
            </div>
          </Card>
        </div>

        {/* Game Area */}
        <div className="max-w-6xl mx-auto">
          <Card className="p-8 glass-card-strong border-4 border-primary">
            {!gameStarted && !escaped && (
              <div className="text-center space-y-6 py-12">
                <Ghost className="w-32 h-32 mx-auto text-primary animate-bounce" />
                <h2 className="text-4xl font-bold">
                  {failed ? '💀 Time Ran Out! 💀' : 'Ready to Escape?'}
                </h2>
                {failed && (
                  <p className="text-xl text-muted-foreground">
                    You solved {puzzles.filter(p => p.solved).length}/4 puzzles
                  </p>
                )}
                <Button 
                  size="lg" 
                  onClick={startGame}
                  className="text-xl px-12 py-6 bg-gradient-primary hover:scale-110 transition-transform"
                >
                  <Key className="mr-2" />
                  {failed ? 'Try Again' : 'Enter the Room'}
                </Button>
              </div>
            )}

            {gameStarted && (
              <div className="space-y-8">
                {/* Puzzle 1: Color Sequence Memory */}
                <div className={`p-6 rounded-lg border-2 ${puzzles[0].solved ? 'border-green bg-green/10' : currentPuzzle === 1 ? 'border-primary bg-primary/10' : 'border-muted bg-muted/5'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      {puzzles[0].solved ? '✅' : '🧩'} Puzzle 1: Memory Sequence
                    </h3>
                    {!puzzles[0].solved && currentPuzzle === 1 && (
                      <Button onClick={showSequencePuzzle} variant="outline">
                        {showSequence ? 'Memorizing...' : 'Show Sequence'}
                      </Button>
                    )}
                  </div>
                  
                  {showSequence && (
                    <div className="flex gap-2 justify-center mb-4 p-4 bg-black/50 rounded-lg">
                      {sequence.map((color, i) => (
                        <div 
                          key={i}
                          className="w-16 h-16 rounded-lg shadow-lg"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}
                  
                  {!puzzles[0].solved && !showSequence && (
                    <>
                      <p className="text-sm text-muted-foreground mb-4">
                        Your sequence: {userSequence.length}/{sequence.length}
                      </p>
                      <div className="flex gap-2 justify-center flex-wrap">
                        {colors.map(color => (
                          <Button
                            key={color}
                            onClick={() => handleSequenceClick(color)}
                            className="w-20 h-20 text-white font-bold text-sm"
                            style={{ backgroundColor: color }}
                          >
                            {color.toUpperCase()}
                          </Button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Puzzle 2: Color Matching */}
                <div className={`p-6 rounded-lg border-2 ${puzzles[1].solved ? 'border-green bg-green/10' : currentPuzzle === 2 ? 'border-primary bg-primary/10' : 'border-muted bg-muted/5'}`}>
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    {puzzles[1].solved ? '✅' : '🧩'} Puzzle 2: Match the Pairs
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    {colorPairs.map((pair, i) => (
                      <button
                        key={i}
                        onClick={() => handlePairClick(i)}
                        disabled={!gameStarted || currentPuzzle < 2 || puzzles[1].solved || pairLock}
                        className={`h-20 rounded-lg border-4 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                          pair.revealed ? 'border-white' : 'border-muted bg-black/80'
                        }`}
                        style={{ backgroundColor: pair.revealed ? pair.color : 'transparent' }}
                      >
                        {pair.revealed ? '' : '❓'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Puzzle 3: Color Code Lock */}
                <div className={`p-6 rounded-lg border-2 ${puzzles[2].solved ? 'border-green bg-green/10' : currentPuzzle === 3 ? 'border-primary bg-primary/10' : 'border-muted bg-muted/5'}`}>
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    {puzzles[2].solved ? '✅ UNLOCKED!' : '🔒'} Puzzle 3: Crack the Code
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    💡 Cryptic Hint: Fire's passion, nature's life, ocean's depth, sun's joy
                  </p>
                  <div className="flex gap-4 justify-center mb-4">
                    {codeLock.map((selected, index) => (
                      <div key={index} className="flex flex-col gap-2 items-center">
                        <div 
                          className="w-20 h-20 rounded-lg border-4 border-white flex items-center justify-center text-2xl"
                          style={{ backgroundColor: selected || '#333' }}
                        >
                          {selected ? '' : <Lock />}
                        </div>
                        {currentPuzzle === 3 && !puzzles[2].solved && (
                          <select
                            value={selected}
                            onChange={(e) => handleCodeChange(index, e.target.value)}
                            className="bg-black text-white border border-primary rounded px-2 py-1"
                          >
                            <option value="">Select</option>
                            {colors.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Puzzle 4: Final Speed Challenge */}
                <div className={`p-6 rounded-lg border-2 ${puzzles[3].solved ? 'border-green bg-green/10' : currentPuzzle === 4 ? 'border-primary bg-primary/10' : 'border-muted bg-muted/5'}`}>
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    {puzzles[3].solved ? '✅' : '🧩'} Puzzle 4: FINAL CHALLENGE - Memory Under Pressure!
                  </h3>
                  <p className="text-sm text-destructive mb-4">
                    ⚠️ The sequence will only show for 1.5 seconds! Better be quick! ⚠️
                  </p>
                  {currentPuzzle === 4 && !puzzles[3].solved && (
                    <>
                      <Button 
                        onClick={() => {
                          const finalSeq = Array.from({ length: 8 }, () => 
                            colors[Math.floor(Math.random() * 6)]
                          );
                          setSequence(finalSeq);
                          setShowSequence(true);
                          setTimeout(() => setShowSequence(false), 1500);
                        }} 
                        variant="outline"
                        className="mb-4"
                      >
                        {showSequence ? 'MEMORIZE NOW!' : 'Show Final Sequence'}
                      </Button>
                      {showSequence && (
                        <div className="flex gap-2 justify-center mb-4 p-4 bg-black/50 rounded-lg flex-wrap">
                          {sequence.slice(0, 8).map((color, i) => (
                            <div 
                              key={i}
                              className="w-12 h-12 rounded-lg shadow-lg"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      )}
                      {!showSequence && (
                        <>
                          <p className="text-sm text-muted-foreground mb-4">
                            Your sequence: {userSequence.length}/8
                          </p>
                          <div className="flex gap-2 justify-center flex-wrap">
                            {colors.map(color => (
                              <Button
                                key={color}
                                onClick={() => {
                                  if (puzzles[3].solved) return;
                                  const newUserSeq = [...userSequence, color];
                                  setUserSequence(newUserSeq);
                                  
                                  if (newUserSeq.length === 8) {
                                    if (JSON.stringify(newUserSeq) === JSON.stringify(sequence.slice(0, 8))) {
                                      setPuzzles(prev => prev.map(p => p.id === 4 ? { ...p, solved: true } : p));
                                      toast({
                                        title: "FINAL PUZZLE SOLVED! 🎃",
                                        description: "The door is unlocked!",
                                      });
                                    } else {
                                      setUserSequence([]);
                                      toast({
                                        title: "Wrong Sequence! 👻",
                                        description: "Start over!",
                                        variant: "destructive",
                                      });
                                    }
                                  }
                                }}
                                className="w-16 h-16 text-white font-bold text-xs"
                                style={{ backgroundColor: color }}
                              >
                                {color.slice(0, 3).toUpperCase()}
                              </Button>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Instructions */}
        <Card className="max-w-6xl mx-auto mt-8 p-6 glass-card-strong">
          <h3 className="text-2xl font-bold mb-4 text-primary">How to Escape:</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>🧩 <strong>Puzzle 1:</strong> Memorize 7 colors in 2 seconds and repeat them perfectly</li>
            <li>🎴 <strong>Puzzle 2:</strong> Find all 6 matching pairs (12 cards total!) by remembering positions</li>
            <li>🔒 <strong>Puzzle 3:</strong> Crack the cryptic 4-color code using the mysterious hint</li>
            <li>⚡ <strong>Puzzle 4:</strong> FINAL BOSS - Memorize 8 colors in only 1.5 seconds!</li>
            <li>⏰ <strong>Time Limit:</strong> Only 3 minutes to escape or you are trapped forever!</li>
            <li>🏆 <strong>Escape Successfully:</strong> Win a secret promo code for a FREE assessment!</li>
          </ul>
        </Card>
      </div>

      {/* Victory Dialog */}
      <Dialog open={escaped} onOpenChange={setEscaped}>
        <DialogContent className="sm:max-w-md glass-card-strong border-4 border-green">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-3xl">
              🎉 YOU ESCAPED! 🎉
            </DialogTitle>
            <DialogDescription className="text-lg">
              Brilliant work! You solved all the puzzles and escaped the haunted room!
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-gradient-primary p-8 rounded-lg text-center space-y-4">
            <p className="text-white text-2xl font-bold animate-pulse">
              🔓 YOUR ESCAPE CODE 🔓
            </p>
            <div className="bg-white/20 backdrop-blur-sm border-4 border-green rounded-lg p-6">
              <p className="text-white text-4xl font-black tracking-widest">
                ESCAPED25
              </p>
            </div>
            <p className="text-white/90 text-base">
              Use this code for a <span className="font-black text-green text-xl">FREE ASSESSMENT</span>!<br />
              You earned your freedom! 🎃
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={copyCode} className="flex-1 gap-2 bg-gradient-green">
              <Copy className="w-4 h-4" />
              Copy Escape Code
            </Button>
            <Button onClick={() => setEscaped(false)} variant="outline" className="flex-1">
              Play Again!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
