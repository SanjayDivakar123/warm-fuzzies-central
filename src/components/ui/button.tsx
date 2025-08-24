import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl hover:-translate-y-0.5",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg hover:shadow-xl",
        outline: "border-2 border-border bg-background hover:bg-accent/50 hover:text-accent-foreground hover:border-primary/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md hover:shadow-lg",
        ghost: "hover:bg-accent/80 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-gradient-rainbow text-white hover:shadow-rainbow hover:scale-105 shadow-colorful border-0 font-bold animate-rainbow-spin",
        primary: "bg-gradient-primary text-white hover:shadow-blue hover:scale-105 shadow-elegant",
        yellow: "bg-gradient-yellow text-yellow-foreground hover:shadow-yellow hover:scale-105 shadow-soft",
        red: "bg-gradient-red text-red-foreground hover:shadow-red hover:scale-105 shadow-soft",
        green: "bg-gradient-green text-green-foreground hover:shadow-green hover:scale-105 shadow-soft",
        blue: "bg-gradient-blue text-blue-foreground hover:shadow-blue hover:scale-105 shadow-soft",
        modern: "bg-card border-2 border-primary/20 text-foreground hover:bg-primary/5 hover:border-primary/40 hover:shadow-colorful",
        glass: "bg-card/80 backdrop-blur-xl border border-border/40 text-foreground hover:bg-card/90 hover:shadow-elegant",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-lg px-4 text-sm",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-16 rounded-2xl px-12 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
