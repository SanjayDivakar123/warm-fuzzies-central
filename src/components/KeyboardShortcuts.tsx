import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

const shortcuts = [
  { key: "H", description: "Go to Home", action: "/" },
  { key: "P", description: "Go to Pricing", action: "/pricing" },
  { key: "T", description: "Scroll to Top", action: "scrollTop" },
  { key: "A", description: "Go to About", action: "/about" },
  { key: "B", description: "Go to Blog", action: "/blog" },
  { key: "C", description: "Go to Contact", action: "/contact" },
  { key: "M", description: "Go to Team", action: "/team" },
  { key: "?", description: "Show this help", action: "help" },
  { key: "Esc", description: "Close dialogs", action: "escape" },
];

const KeyboardShortcuts = () => {
  const [showHelp, setShowHelp] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName) ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      switch (key) {
        case "?":
          e.preventDefault();
          setShowHelp(true);
          break;
        case "h":
          e.preventDefault();
          navigate("/");
          break;
        case "p":
          e.preventDefault();
          navigate("/pricing");
          break;
        case "a":
          e.preventDefault();
          navigate("/about");
          break;
        case "b":
          e.preventDefault();
          navigate("/blog");
          break;
        case "c":
          e.preventDefault();
          navigate("/contact");
          break;
        case "m":
          e.preventDefault();
          navigate("/team");
          break;
        case "t":
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
          break;
        case "escape":
          setShowHelp(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [navigate]);

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-8 left-8 p-2.5 rounded-full bg-muted/80 text-muted-foreground shadow-lg transition-all duration-300 hover:scale-110 hover:bg-muted hover:text-foreground z-50 group"
        aria-label="Keyboard shortcuts"
        title="Keyboard shortcuts (?)"
      >
        <Keyboard className="w-4 h-4" />
      </button>

      {/* Help Modal */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            {shortcuts.map((shortcut) => (
              <div
                key={shortcut.key}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm text-muted-foreground">
                  {shortcut.description}
                </span>
                <kbd className="px-2.5 py-1.5 text-xs font-semibold text-foreground bg-muted border border-border rounded-md shadow-sm min-w-[2rem] text-center">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center border-t pt-4">
            Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">?</kbd> anytime to show this help
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default KeyboardShortcuts;
