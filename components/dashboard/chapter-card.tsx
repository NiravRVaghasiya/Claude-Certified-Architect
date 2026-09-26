"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { AnimatedCheck } from "@/components/animations/animated-check";
import { Badge } from "@/components/ui/badge";
import { CardLink } from "@/components/ui/card";
import { chapterDek } from "@/lib/dek";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

/**
 * `true` only when completion flipped to done while the card was mounted.
 *
 * A domain grid can render 20 finished cards at once and the dashboard 70 rows;
 * drawing that many ticks on arrival would be noise, so the stroke is reserved
 * for the one card whose state actually changed. The first post-hydration value
 * is treated as the baseline — localStorage landing is not a change, it is the
 * card finally learning what was already true.
 *
 * Lives here rather than in its own module so both dashboard cards share one
 * implementation of "was this already done, or did it just happen?".
 */
export function useCompletionDraw(done: boolean, hydrated: boolean): boolean {
  const settled = React.useRef(false);
  const [draw, setDraw] = React.useState(false);

  React.useEffect(() => {
    if (!hydrated) return;
    if (settled.current) setDraw(done);
    else settled.current = true;
  }, [hydrated, done]);

  return draw;
}

/** The chapter fields a card renders — a narrow slice of `ChapterSummary`. */
export interface ChapterCardChapter {
  slug: string;
  chapterNumber: number;
  title: string;
  dek: string | null;
  readingTime: number;
}

export interface ChapterCardProps {
  chapter: ChapterCardChapter;
  className?: string;
}

export function ChapterCard({ chapter, className }: ChapterCardProps) {
  const { hydrated, isComplete } = useProgress();
  const done = hydrated && isComplete(chapter.slug);
  const draw = useCompletionDraw(done, hydrated);
  const dek = chapterDek(chapter.dek);

  return (
    <CardLink
      href={`/chapters/${chapter.slug}`}
      className={cn("flex h-full flex-col p-5", done && "border-success/30", className)}
    >
      {/* 1.375rem is the success badge's exact height (16px line + 4px padding +
          2px border), so the badge arriving after hydration cannot reflow the
          title beneath it or change the card's height in the grid. */}
      <div className="flex min-h-[1.375rem] items-center justify-between gap-2">
        <span className="eyebrow">Chapter {chapter.chapterNumber}</span>
        {done && (
          <Badge variant="success" size="sm" mono>
            <AnimatedCheck size={12} instant={!draw} />
            Done
          </Badge>
        )}
      </div>

      <h3 className="mt-2.5 text-[0.9375rem] font-semibold leading-snug tracking-display">
        {chapter.title}
      </h3>
      {dek && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{dek}</p>}

      <p className="eyebrow mt-auto flex items-center gap-1.5 pt-5">
        <Clock className="size-3 shrink-0" aria-hidden="true" />
        {chapter.readingTime} min read
      </p>
    </CardLink>
  );
}
