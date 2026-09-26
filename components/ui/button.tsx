"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { useMagnetic } from "@/components/animations/magnetic";
import { transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md",
    "text-sm font-medium tracking-[-0.005em]",
    "transition-[background-color,border-color,color,box-shadow,opacity] duration-150 ease-emphasis",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        accent: "bg-accent text-accent-foreground shadow-xs hover:bg-accent/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-muted",
        outline:
          "border border-border bg-card text-foreground shadow-xs hover:border-border-strong hover:bg-muted/60",
        ghost: "text-foreground/80 hover:bg-muted hover:text-foreground",
        success: "bg-success text-success-foreground shadow-xs hover:bg-success/90",
        link: "text-foreground underline decoration-accent/50 underline-offset-4 hover:decoration-accent",
      },
      size: {
        xs: "h-7 gap-1.5 px-2.5 text-xs [&_svg]:size-3.5",
        sm: "h-8 px-3 text-[0.8125rem] [&_svg]:size-4",
        default: "h-9 px-4 [&_svg]:size-4",
        lg: "h-11 px-5 text-[0.9375rem] [&_svg]:size-[1.125rem]",
        icon: "size-9 [&_svg]:size-4",
        "icon-sm": "size-8 [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export interface AnimatedButtonProps
  extends Omit<HTMLMotionProps<"button">, "children">,
    VariantProps<typeof buttonVariants> {
  children?: React.ReactNode;
  /** Lean toward the pointer. `true` = 3px; pass a number for a custom pull. */
  magnetic?: boolean | number;
}

/**
 * Button with physical feedback (L1).
 *
 * Optionally magnetic: the control leans a few pixels toward the cursor and
 * springs back. When the magnet is on, the press is carried by a tiny scale
 * instead of `y` — the pointer spring owns `y`, and animating both would make
 * the two fight over the same transform.
 */
const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, variant, size, children, magnetic = false, style, ...props }, ref) => {
    const pull = useMagnetic(typeof magnetic === "number" ? magnetic : 3);
    const on = magnetic !== false && pull.enabled;

    return (
      <motion.button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...(on ? pull.handlers : null)}
        style={on ? { ...pull.style, ...(style as React.CSSProperties) } : style}
        whileHover={on ? undefined : { y: -1 }}
        whileTap={on ? { scale: 0.985 } : { y: 1 }}
        transition={transitions.press}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
AnimatedButton.displayName = "AnimatedButton";

export { Button, AnimatedButton, buttonVariants };
