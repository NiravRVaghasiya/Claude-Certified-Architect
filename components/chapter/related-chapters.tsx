"use client";

import * as React from "react";
import { ArrowRight, Check, Clock } from "lucide-react";
import { AnimatedItem, AnimatedList } from "@/components/animations/animated-section";
import { CardLink } from "@/components/ui/card";
import { cappedStagger } from "@/lib/motion";
import { useProgress } from "@/lib/progress";
import type { ChapterSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface RelatedChaptersProps {
  /** Pre-selected on the server (same domain first, adjacent chapters as top-up). */
  chapters: ChapterSummary[];
  className?: string;
}

/**
 * "Related concepts" — the neighbouring chapters worth reading next. Completion
 * state comes from local progress, so this is a client island; when there is
 * nothing to suggest the section does not render at all.
 *
 * L3 on arrival, then still: the heading is static and the cards cascade once as
 * the section scrolls in. `cappedStagger` keeps the whole group inside one
 * entrance window however many cards there are, so it reads as a single gesture
 * instead of a queue. After that the only motion is per-card hover (L1).
 */
export function RelatedChapters({ chapters, className }: RelatedChaptersProps) {
  const { hydrated, isComplete } = useProgress();

  if (chapters.length === 0) return null;

  return (
    <section aria-labelledby="related-concepts" className={cn("mt-14", className)}>
      <h2 id="related-concepts" className="text-base font-semibold tracking-display sm:text-lg">
        Related concepts
      </h2>
      <AnimatedList
        as="ul"
        stagger={cappedStagger(chapters.length)}
        className="mt-4 grid gap-3 sm:grid-cols-2"
      >
        {chapters.map((chapter) => {
          const complete = hydrated && isComplete(chapter.slug);
          return (
            <AnimatedItem as="li" key={chapter.slug} tight className="min-w-0">
              <CardLink href={`/chapters/${chapter.slug}`} className="group h-full p-4">
                <span className="flex items-center gap-2">
                  <span className="font-mono text-2xs tabular text-muted-foreground">
                    {chapter.chapterNumber}
                  </span>
                  {complete && (
                    <span className="eyebrow flex items-center gap-1 text-success">
                      {/* Static tick: this is a fact being reported, not a moment. */}
                      <Check className="size-3" aria-hidden="true" />
                      Done
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "mt-1.5 block text-sm font-medium leading-snug transition-colors duration-200 ease-emphasis",
                    "text-foreground group-hover:text-accent group-focus-visible:text-accent"
                  )}
                >
                  {chapter.title}
                </span>
                <span className="eyebrow mt-2 flex items-center gap-1.5">
                  <Clock className="size-3" aria-hidden="true" />
                  <span className="tabular">{chapter.readingTime}</span> min
                  {/* The card's 3px lift comes from CardLink; the arrow travels with
                      it so the hover has a direction as well as a height. CSS
                      transform rather than framer — there is no state here, and it
                      pairs with focus-visible so a keyboard gets the same cue. */}
                  <ArrowRight
                    className={cn(
                      "ml-auto size-3 text-muted-foreground",
                      "transition-[transform,color] duration-150 ease-emphasis",
                      "group-hover:translate-x-0.5 group-hover:text-accent",
                      "group-focus-visible:translate-x-0.5 group-focus-visible:text-accent"
                    )}
                    aria-hidden="true"
                  />
                </span>
              </CardLink>
            </AnimatedItem>
          );
        })}
      </AnimatedList>
    </section>
  );
}
