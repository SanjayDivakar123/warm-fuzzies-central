// @ts-nocheck
import { useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface CreditNotification {
  id: string;
  amount: number;
  description: string | null;
}

interface CreditNotificationModalProps {
  open: boolean;
  onClose: () => void;
  notifications: CreditNotification[];
}

const COLORS = ['#22c55e', '#16a34a', '#4ade80', '#86efac', '#fbbf24', '#f59e0b', '#60a5fa', '#a78bfa'];

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: {
      x: number; y: number; vx: number; vy: number;
      color: string; size: number; rotation: number; rotationSpeed: number; opacity: number;
    }[] = [];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -10 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 5 + Math.random() * 6,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.15,
        opacity: 1,
      });
    }

    let animId: number;
    let frame = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        if (frame > 60) p.opacity = Math.max(0, p.opacity - 0.008);

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });

      if (particles.some((p) => p.opacity > 0)) {
        animId = requestAnimationFrame(draw);
      }
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 w-full h-full rounded-lg"
    />
  );
}

const formatUsd = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export default function CreditNotificationModal({
  open,
  onClose,
  notifications,
}: CreditNotificationModalProps) {
  if (!notifications.length) return null;

  const totalAmount = notifications.reduce((sum, n) => sum + n.amount, 0);
  const latestDescription = notifications[notifications.length - 1]?.description;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0 border-0">
        <div className="relative bg-gradient-to-b from-green-950 to-background rounded-lg p-8 text-center">
          <Confetti />

          <div className="relative z-10 flex flex-col items-center gap-4">
            {/* Animated icon */}
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 animate-bounce">
              <Sparkles className="h-8 w-8 text-green-400" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white">Credits Added!</h2>
              <p className="text-green-400 text-sm font-medium">Your billing wallet has been topped up</p>
            </div>

            {/* Amount badge */}
            <div className="bg-green-500/20 border border-green-500/40 rounded-full px-6 py-2">
              <span className="text-3xl font-bold text-green-300">
                +{formatUsd(totalAmount)}
              </span>
            </div>

            {/* Description */}
            {latestDescription && (
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed bg-muted/30 rounded-lg px-4 py-3">
                {latestDescription}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              Credits are automatically applied before charging your card on file.
            </p>

            <Button
              onClick={onClose}
              className="w-full bg-green-600 hover:bg-green-500 text-white mt-2"
            >
              Got it — thanks!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
