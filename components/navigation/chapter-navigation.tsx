"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CardLink } from "@/components/ui/card";
import type { ChapterSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Previous / next chapter pair.
 *
 * L1 throughout: the card lifts 3px, the border and shadow firm up, and the arrow
 * travels 2px in the direction it points. No magnet (the target is far too large
 * to lean convincingly) and no scale (text inside a scaling box reflows badly).
 */
export function ChapterNavigation({
  prev,
  next,
}: {
  prev: ChapterSummary | null;
  next: ChapterSummary | null;
}) {
  if (!prev && !next) return null;

  return (
    <nav
      aria-label="Chapter navigation"
      className="mt-14 grid gap-3 border-t border-border pt-8 sm:grid-cols-2"
    >
      {prev ? (
        <NavCard chapter={prev} direction="prev" />
      ) : (
        <div className="hidden sm:block" aria-hidden="true" />
      )}
      {next && <NavCard chapter={next} direction="next" />}
    </nav>
  );
}

function NavCard({
  chapter,
  direction,
}: {
  chapter: ChapterSummary;
  direction: "prev" | "next";
}) {
  const isNext = direction === "next";
  const Arrow = isNext ? ArrowRight : ArrowLeft;

  return (
    <CardLink
      href={`/chapters/${chapter.slug}`}
      className={cn("group p-4", isNext && "sm:col-start-2 sm:text-right")}
    >
      <span
        className={cn(
          "eyebrow flex items-center gap-1.5",
          isNext && "sm:justify-end"
        )}
      >
        {/* Focus-visible is paired with hover so the arrow answers the keyboard too. */}
        {!isNext && (
          <Arrow
            className="size-3 transition-transform duration-[160ms] ease-emphasis group-hover:-translate-x-0.5 group-focus-visible:-translate-x-0.5"
            aria-hidden="true"
          />
        )}
        {isNext ? "Next" : "Previous"}
        {isNext && (
          <Arrow
            className="size-3 transition-transform duration-[160ms] ease-emphasis group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5"
            aria-hidden="true"
          />
        )}
      </span>
      <span className="mt-1.5 flex items-baseline gap-2 text-sm font-medium leading-snug text-foreground">
        {!isNext && (
          <span className="font-mono text-2xs tabular text-muted-foreground">
            {chapter.chapterNumber}
          </span>
        )}
        <span className={cn("min-w-0 flex-1", isNext && "sm:text-right")}>{chapter.title}</span>
        {isNext && (
          <span className="font-mono text-2xs tabular text-muted-foreground">
            {chapter.chapterNumber}
          </span>
        )}
      </span>
    </CardLink>
  );
}
