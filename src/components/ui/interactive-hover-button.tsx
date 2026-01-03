import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
}

const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(({ text = "Button", className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "group relative w-auto cursor-pointer overflow-hidden rounded-full border border-primary bg-background px-8 py-4 text-center font-semibold text-foreground",
        className
      )}
      {...props}
    >
      <span className="relative z-10 inline-block transition-all duration-300 group-hover:text-primary-foreground">
        {text}
      </span>
      <span className="absolute right-6 top-1/2 z-10 -translate-y-1/2 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:text-primary-foreground">
        <ArrowRight className="h-5 w-5" />
      </span>
      <span className="absolute inset-0 z-0 scale-0 rounded-full bg-primary transition-transform duration-300 ease-out group-hover:scale-100" />
    </button>
  );
});

InteractiveHoverButton.displayName = "InteractiveHoverButton";

export { InteractiveHoverButton };
