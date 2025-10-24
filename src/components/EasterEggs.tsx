import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, PartyPopper } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const EasterEggs = () => {
  const [showModal, setShowModal] = useState(false);
  const [foundEgg, setFoundEgg] = useState("");
  const [konamiProgress, setKonamiProgress] = useState(0);
  const [logoClicks, setLogoClicks] = useState(0);

  // Konami Code: ↑ ↑ ↓ ↓ ← → ← → B A
  const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === konamiCode[konamiProgress].toLowerCase()) {
        const newProgress = konamiProgress + 1;
        setKonamiProgress(newProgress);
        
        if (newProgress === konamiCode.length) {
          triggerEasterEgg("konami");
          setKonamiProgress(0);
        }
      } else {
        setKonamiProgress(0);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [konamiProgress]);

  const triggerEasterEgg = (eggType: string) => {
    setFoundEgg(eggType);
    setShowModal(true);
    
    // Confetti effect
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const colors = ['#FF7518', '#6D28D9', '#8B5CF6', '#27bd73'];

    (function frame() {
      // @ts-ignore
      if (window.confetti) {
        // @ts-ignore
        window.confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        // @ts-ignore
        window.confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });
      }

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  const copyCode = () => {
    navigator.clipboard.writeText('FOUNDIT2025');
    toast({
      title: "Code Copied! 🎃",
      description: "FOUNDIT2025 has been copied to your clipboard!",
    });
  };

  const eggMessages: Record<string, { title: string; description: string }> = {
    konami: {
      title: "🎮 Konami Code Master!",
      description: "You found the legendary secret! The old ways still work..."
    },
    ghost: {
      title: "👻 Ghost Hunter!",
      description: "You caught the sneaky ghost! Boo-tiful job!"
    },
    pumpkin: {
      title: "🎃 Pumpkin Picker!",
      description: "You found the special golden pumpkin hiding in plain sight!"
    },
    logo: {
      title: "🔮 Logo Legend!",
      description: "Persistence pays off! You clicked the logo 10 times!"
    },
    footer: {
      title: "🕷️ Spider Spotter!",
      description: "You found the hidden spider in the footer!"
    }
  };

  // Add global easter egg triggers
  useEffect(() => {
    // @ts-ignore
    window.triggerEasterEgg = triggerEasterEgg;
    // @ts-ignore
    window.trackLogoClicks = () => {
      const newClicks = logoClicks + 1;
      setLogoClicks(newClicks);
      if (newClicks === 10) {
        triggerEasterEgg("logo");
        setLogoClicks(0);
      }
    };
  }, [logoClicks]);

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="sm:max-w-md glass-card-strong border-2 border-primary">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <PartyPopper className="w-6 h-6 text-primary animate-bounce" />
            {eggMessages[foundEgg]?.title || "You Found It!"}
          </DialogTitle>
          <DialogDescription className="text-base">
            {eggMessages[foundEgg]?.description || "Congratulations on finding this secret!"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-gradient-primary p-6 rounded-lg text-center space-y-4">
          <p className="text-white text-lg font-semibold">
            🎉 Your Free Assessment Code:
          </p>
          <div className="bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg p-4">
            <p className="text-white text-3xl font-black tracking-widest">
              FOUNDIT2025
            </p>
          </div>
          <p className="text-white/90 text-sm">
            Use this code at checkout to get any assessment completely FREE! 🎃
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={copyCode} className="flex-1 gap-2">
            <Copy className="w-4 h-4" />
            Copy Code
          </Button>
          <Button onClick={() => setShowModal(false)} variant="outline" className="flex-1">
            Awesome!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
