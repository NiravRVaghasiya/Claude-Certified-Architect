import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Trail above a page title. On narrow screens the intermediate crumbs collapse
 * so the first and last stay readable rather than wrapping to three lines.
 *
 * Deliberately static: this row sits directly above the page title, and anything
 * that moves here competes with the title's own entrance. The only motion is the
 * L1 colour/underline change on a link the pointer is actually over — pure CSS, so
 * it costs no JS and needs no hydration.
 */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          const isIntermediate = i > 0 && !isLast;
          return (
            <li
              key={`${item.label}-${i}`}
              className={cn("flex min-w-0 items-center gap-1.5", isIntermediate && "hidden sm:flex")}
            >
              {item.href ? (
                <Link
                  href={item.href}
                  className="eyebrow max-w-[16ch] truncate decoration-accent/40 underline-offset-[3px] transition-colors duration-[160ms] ease-emphasis hover:text-accent hover:underline focus-visible:text-accent focus-visible:underline sm:max-w-[28ch]"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="eyebrow max-w-[20ch] truncate text-foreground/80 sm:max-w-none" aria-current="page">
                  {item.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight
                  className="size-3 shrink-0 text-muted-foreground/50"
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
