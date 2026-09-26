"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Check, Clock } from "lucide-react";
import { AnimatedSection } from "@/components/animations/animated-section";
import { Magnetic } from "@/components/animations/magnetic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardLink } from "@/components/ui/card";
import { TRACK_COLOR, TRACK_SHORT } from "@/lib/nav";
import { useProgress } from "@/lib/progress";
import type { Track } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface ContinueChapter {
  slug: string;
  chapterNumber: number;
  title: string;
  domainTitle: string;
  track: Track;
  readingTime: number;
}

interface Resolved {
  chapter: ContinueChapter;
  /** True when the target is the chapter the reader actually left off on. */
  resumed: boolean;
}

/**
 * Where "continue" should go: the last chapter opened if it is still unfinished,
 * otherwise the earliest chapter that has not been completed. Returns `null` only
 * when every chapter is done.
 *
 * Before hydration `completed` is empty and `lastVisited` is null, so this
 * resolves to chapter 1 — a stable value the server and client agree on.
 */
function resolveContinue(
  chapters: ContinueChapter[],
  completed: Set<string>,
  lastVisited: string | null
): Resolved | null {
  const visited = lastVisited ? chapters.find((c) => c.slug === lastVisited) : undefined;
  if (visited && !completed.has(visited.slug)) return { chapter: visited, resumed: true };
  const next = chapters.find((c) => !completed.has(c.slug));
  return next ? { chapter: next, resumed: false } : null;
}

/**
 * Hero CTA pointing at the resume target. The label is deliberately constant so
 * the button never changes width when the real target arrives after hydration.
 */
export function ContinueCta({
  chapters,
  className,
}: {
  chapters: ContinueChapter[];
  className?: string;
}) {
  const { completed, lastVisited } = useProgress();
  const target = resolveContinue(chapters, completed, lastVisited);
  // Everything complete → send the reader back to the start for review.
  const slug = target?.chapter.slug ?? chapters[0]?.slug;
  if (!slug) return null;

  return (
    // The dashboard's single magnetic control (L1). It is the one primary action
    // on the page, so a 3px lean toward the pointer puts the weight on the thing
    // that matters — and nothing else on the page does it, which is the point.
    // Wrapping rather than swapping in `AnimatedButton` keeps `Button asChild` +
    // `<Link>` intact: real href, prefetch, and one focus ring on the anchor.
    // The arrow deliberately does NOT travel here; the lean is already the hover.
    <Magnetic className={cn("inline-flex", className)}>
      <Button asChild>
        <Link href={`/chapters/${slug}`}>
          Continue learning
          <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </Magnetic>
  );
}

/**
 * Placeholder shown until progress hydrates. It is the real card's markup with
 * the text replaced by bars, so it reserves the correct height instead of
 * guessing one with a min-height.
 *
 * Each bar sits in a box the height of the line it stands in for (eyebrow 16px,
 * title 24px, meta 16px) with the real card's 6px gaps, so the column measures
 * 68px either way and resolving the target cannot shift the page. It is also
 * completely still: a shimmer here would be the only looping animation in the
 * app, and the bars already read as "not resolved yet".
 */
function ContinuePlaceholder({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={className}>
      <Card className="flex items-center gap-4 p-5">
        <span className="size-10 shrink-0 rounded-full bg-muted" />
        <div className="min-w-0 flex-1">
          <span className="flex h-4 items-center">
            <span className="block h-2.5 w-28 rounded bg-muted" />
          </span>
          <span className="mt-1.5 flex h-6 items-center">
            <span className="block h-3.5 w-3/4 rounded bg-muted" />
          </span>
          <span className="mt-1.5 flex h-4 items-center">
            <span className="block h-2.5 w-1/2 rounded bg-muted" />
          </span>
        </div>
      </Card>
    </div>
  );
}

/**
 * "Continue where you left off". Stays empty until progress has hydrated — a
 * server-rendered guess would flash the wrong chapter on every load — but holds
 * its own height so the sections beneath it never shift.
 */
export function ContinueCard({
  chapters,
  className,
}: {
  chapters: ContinueChapter[];
  className?: string;
}) {
  const { hydrated, completed, lastVisited } = useProgress();
  if (chapters.length === 0) return null;
  if (!hydrated) return <ContinuePlaceholder className={className} />;

  const target = resolveContinue(chapters, completed, lastVisited);

  if (!target) {
    return (
      <AnimatedSection immediate tight className={className}>
        <Card className="flex h-full flex-wrap items-center gap-4 border-success/30 p-5">
          {/* A plain check, not an `AnimatedCheck`: this card only ever mounts with
              the work already finished, and drawing the tick would replay a moment
              that happened on another page on every visit to this one. */}
          <span
            className="grid size-10 shrink-0 place-items-center rounded-full bg-success/10 text-success"
            aria-hidden="true"
          >
            <Check className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <Badge variant="success" size="sm" mono>
              Complete
            </Badge>
            <p className="mt-2 font-semibold tracking-display">
              All {chapters.length} chapters finished.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Nothing left in the queue — revisit a domain or drill the practice chapters.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/search">Search chapters</Link>
          </Button>
        </Card>
      </AnimatedSection>
    );
  }

  const { chapter, resumed } = target;

  return (
    <AnimatedSection immediate tight className={className}>
      <CardLink href={`/chapters/${chapter.slug}`} className="group h-full p-5">
        <div className="flex h-full items-center gap-4">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/10 text-accent"
            aria-hidden="true"
          >
            <BookOpen className="size-5" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="eyebrow text-accent">
              {resumed ? "Continue where you left off" : "Up next"}
            </p>
            <p className="mt-1.5 truncate font-semibold tracking-display">
              <span className="font-mono text-sm tabular text-muted-foreground">
                {chapter.chapterNumber}
              </span>{" "}
              {chapter.title}
            </p>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span className={cn(TRACK_COLOR[chapter.track]?.text)}>
                {TRACK_SHORT[chapter.track]}
              </span>
              <span aria-hidden="true">·</span>
              <span className="min-w-0 truncate">
                {chapter.domainTitle}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" aria-hidden="true" />
                {chapter.readingTime} min
              </span>
            </p>
          </div>

          {/* L1: the arrow travels 2px toward where the link goes. Paired with
              `group-focus-visible` so the keyboard gets the same affordance as
              the pointer, and it is transform-only so nothing reflows. */}
          <ArrowRight
            className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 ease-emphasis group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5"
            aria-hidden="true"
          />
        </div>
      </CardLink>
    </AnimatedSection>
  );
}
