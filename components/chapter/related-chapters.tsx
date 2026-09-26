"use client";

import * as React from "react";
import { Check, Clock } from "lucide-react";
import { AnimatedItem, AnimatedList } from "@/components/animations/animated-section";
import { CardLink } from "@/components/ui/card";
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
 */
export function RelatedChapters({ chapters, className }: RelatedChaptersProps) {
  const { hydrated, isComplete } = useProgress();

  if (chapters.length === 0) return null;

  return (
    <section aria-labelledby="related-concepts" className={cn("mt-14", className)}>
      <h2 id="related-concepts" className="text-base font-semibold tracking-display sm:text-lg">
        Related concepts
      </h2>
      <AnimatedList as="ul" stagger={0.04} className="mt-4 grid gap-3 sm:grid-cols-2">
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
                </span>
              </CardLink>
            </AnimatedItem>
          );
        })}
      </AnimatedList>
    </section>
  );
}
