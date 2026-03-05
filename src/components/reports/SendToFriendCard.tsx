import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Send } from "lucide-react";

interface SendToFriendCardProps {
  color?: string | null;
  className?: string;
}

const colorMeta: Record<string, { emoji: string; label: string }> = {
  red: { emoji: "🔴", label: "Motivator" },
  yellow: { emoji: "🟡", label: "Executor" },
  green: { emoji: "🟢", label: "Strategist" },
  blue: { emoji: "🔵", label: "Connector" },
};

export default function SendToFriendCard({ color, className }: SendToFriendCardProps) {
  const { toast } = useToast();
  const [recipientName, setRecipientName] = useState("");

  const normalizedColor = (color || "red").toLowerCase();
  const colorInfo = colorMeta[normalizedColor] || colorMeta.red;

  const shareUrl = `${window.location.origin}/free-assessment`;

  const shareMessage = useMemo(() => {
    const intro = recipientName.trim() ? `Hey ${recipientName.trim()}, ` : "";
    return `${intro}I just took the RoleColorFinder test and I'm a ${colorInfo.emoji} ${colorInfo.label}.\nYou should take it too — curious what color you are.\n${shareUrl}`;
  }, [recipientName, colorInfo.emoji, colorInfo.label, shareUrl]);

  const copyMessage = async () => {
    await navigator.clipboard.writeText(shareMessage);
    toast({
      title: "Message copied",
      description: "Share it with coworkers, classmates, or friends.",
    });
  };

  const openSms = () => {
    window.open(`sms:?&body=${encodeURIComponent(shareMessage)}`, "_blank");
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl">The “Send to a Friend” Loop</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Who on your team should take this test?
        </p>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Coworkers</Badge>
          <Badge variant="secondary">Classmates</Badge>
          <Badge variant="secondary">Friends</Badge>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Message</p>
          <Input
            value={recipientName}
            onChange={(event) => setRecipientName(event.target.value)}
            placeholder="Optional name (e.g., Alex)"
          />
          <div className="rounded-md border bg-muted/30 p-3 whitespace-pre-wrap text-sm">
            {shareMessage}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={copyMessage}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Message
          </Button>
          <Button type="button" variant="outline" onClick={openSms}>
            <Send className="w-4 h-4 mr-2" />
            Send via Text
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          One person can bring in a whole group.
        </p>
      </CardContent>
    </Card>
  );
}
