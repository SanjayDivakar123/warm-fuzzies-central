import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Camera, Download, Linkedin, Copy } from "lucide-react";
import html2canvas from "html2canvas";

interface RoleColorIdentityCardProps {
  name?: string | null;
  primaryColor: string;
  secondaryColor?: string | null;
  className?: string;
}

const colorMeta: Record<string, { emoji: string; label: string }> = {
  red: { emoji: "🔴", label: "Motivator" },
  yellow: { emoji: "🟡", label: "Executor" },
  green: { emoji: "🟢", label: "Strategist" },
  blue: { emoji: "🔵", label: "Visionary" },
};

const leadershipStyle: Record<string, string> = {
  red: "You ignite people and move them toward action.",
  yellow: "You drive momentum and get teams across the finish line.",
  green: "You build systems that turn complexity into clarity.",
  blue: "You spot future possibilities and inspire fresh direction.",
};

const colorAccent: Record<string, string> = {
  red: "border-red-500/30 bg-red-500/5",
  yellow: "border-yellow-500/30 bg-yellow-500/5",
  green: "border-green-500/30 bg-green-500/5",
  blue: "border-blue-500/30 bg-blue-500/5",
};

const normalize = (value?: string | null) => (value || "red").toLowerCase();

export default function RoleColorIdentityCard({ name, primaryColor, secondaryColor, className }: RoleColorIdentityCardProps) {
  const { toast } = useToast();
  const cardCaptureRef = useRef<HTMLDivElement>(null);

  const normalizedPrimary = normalize(primaryColor);
  const normalizedSecondary = normalize(secondaryColor);

  const primary = colorMeta[normalizedPrimary] || colorMeta.red;
  const secondary = colorMeta[normalizedSecondary] || null;
  const accentClass = colorAccent[normalizedPrimary] || colorAccent.red;

  const displayName = (name || "RoleColor Member").toUpperCase();
  const caption = `Just discovered I'm a ${primary.emoji} ${primary.label} on RoleColorFinder.`;
  const reportUrl = window.location.href;

  const copyCaption = async () => {
    await navigator.clipboard.writeText(`${caption}\n${reportUrl}`);
    toast({
      title: "Caption copied",
      description: "Paste it on Instagram, LinkedIn, TikTok, or Snapchat.",
    });
  };

  const shareLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(reportUrl)}`;
    window.open(linkedInUrl, "_blank", "noopener,noreferrer");
  };

  const openPlatform = async (platform: "instagram" | "tiktok" | "snapchat") => {
    await navigator.clipboard.writeText(`${caption}\n${reportUrl}`);
    const urls: Record<typeof platform, string> = {
      instagram: "https://www.instagram.com/",
      tiktok: "https://www.tiktok.com/",
      snapchat: "https://www.snapchat.com/",
    };
    window.open(urls[platform], "_blank", "noopener,noreferrer");
    toast({
      title: "Caption copied",
      description: `Paste your identity caption on ${platform}.`,
    });
  };

  const downloadCard = async () => {
    if (!cardCaptureRef.current) return;

    try {
      const canvas = await html2canvas(cardCaptureRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      const link = document.createElement("a");
      const safeName = displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const safeRole = primary.label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      link.download = `${safeName || "rolecolor-member"}-${safeRole}-identity-card.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast({
        title: "Identity card downloaded",
        description: "Your branded RoleColor card PNG is ready to share.",
      });
    } catch (error) {
      console.error("Identity card export failed:", error);
      toast({
        title: "Export failed",
        description: "Could not save PNG. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={`overflow-hidden border-border/60 shadow-lg ${className || ""}`}>
      <div ref={cardCaptureRef} className="bg-card">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/60">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">RoleColor Identity Card</p>
              <CardTitle className="text-2xl">Your Shareable Leadership Card</CardTitle>
            </div>
            <img
              src="/uploads/b0720aa1-19dc-4cac-aefe-2dfb86343600.png"
              alt="RC Logo"
              className="h-10 w-auto opacity-90"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-6">
          <div className={`rounded-2xl border p-6 ${accentClass}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Verified RoleColor Member</p>
                <h3 className="text-2xl font-black tracking-wide mt-1">{displayName}</h3>
              </div>
              <Badge variant="outline" className="text-xs">RCF • Identity</Badge>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge className="text-sm px-3 py-1" variant="secondary">{primary.emoji} {primary.label}</Badge>
              {secondaryColor && secondary && (
                <Badge className="text-sm px-3 py-1" variant="outline">Secondary: {secondary.emoji} {secondary.label}</Badge>
              )}
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold mb-1">Your leadership style</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{leadershipStyle[normalizedPrimary] || leadershipStyle.red}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Suggested caption</p>
            <div className="rounded-lg border bg-muted/20 p-3 text-sm">"{caption}"</div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant="outline">Instagram</Badge>
              <Badge variant="outline">LinkedIn</Badge>
              <Badge variant="outline">TikTok</Badge>
              <Badge variant="outline">Snapchat</Badge>
            </div>
          </div>
        </CardContent>
      </div>

      <CardContent className="pt-0 p-6">
        <div className="flex flex-wrap gap-2">
          <Button onClick={copyCaption} type="button" variant="outline">
            <Copy className="w-4 h-4 mr-2" />
            Copy Caption
          </Button>
          <Button onClick={shareLinkedIn} type="button">
            <Linkedin className="w-4 h-4 mr-2" />
            Share LinkedIn
          </Button>
          <Button onClick={() => openPlatform("instagram")} type="button" variant="outline">
            <Camera className="w-4 h-4 mr-2" />
            Instagram
          </Button>
          <Button onClick={() => openPlatform("tiktok")} type="button" variant="outline">
            TikTok
          </Button>
          <Button onClick={() => openPlatform("snapchat")} type="button" variant="outline">
            Snapchat
          </Button>
          <Button onClick={downloadCard} type="button" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Save PNG
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
