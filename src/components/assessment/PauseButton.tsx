import { Button } from "@/components/ui/button";
import { Pause, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface PauseButtonProps {
  onSave: () => Promise<void> | void;
  disabled?: boolean;
}

export function PauseButton({ onSave, disabled }: PauseButtonProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePause = async () => {
    await onSave();
    toast({
      title: "Progress Saved",
      description: "Your progress has been saved. You can resume anytime from your dashboard.",
    });
    navigate("/dashboard");
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePause}
      disabled={disabled}
      className="flex items-center gap-2"
    >
      <Save className="w-4 h-4" />
      Save & Exit
    </Button>
  );
}
