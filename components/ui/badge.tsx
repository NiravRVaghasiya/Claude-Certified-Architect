import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-medium [&_svg]:size-3",
  {
    variants: {
      variant: {
        neutral: "border-border bg-muted/70 text-muted-foreground",
        outline: "border-border bg-transparent text-muted-foreground",
        accent: "border-accent/25 bg-accent/10 text-accent",
        success: "border-success/25 bg-success/10 text-success",
        foundation: "border-foundation/25 bg-foundation/10 text-foundation",
        professional: "border-professional/25 bg-professional/10 text-professional",
      },
      size: {
        sm: "px-2 py-0.5 text-2xs",
        default: "px-2.5 py-0.5 text-xs",
      },
      mono: {
        true: "font-mono uppercase tracking-label",
        false: "",
      },
    },
    defaultVariants: { variant: "neutral", size: "default", mono: false },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, mono, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size, mono, className }))} {...props} />;
}

export { badgeVariants };
