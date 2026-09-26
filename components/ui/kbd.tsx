import * as React from "react";
import { cn } from "@/lib/utils";

/** Keycap. Used for the ⌘K hint and palette footer hints. */
export function Kbd({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}
