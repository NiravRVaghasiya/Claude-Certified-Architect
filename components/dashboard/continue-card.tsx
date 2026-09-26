"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Check, Clock } from "lucide-react";
import { AnimatedSection } from "@/components/animations/animated-section";
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
    <Button asChild className={className}>
      <Link href={`/chapters/${slug}`}>
        Continue learning
        <ArrowRight aria-hidden="true" />
      </Link>
    </Button>
  );
}

/**
 * Placeholder shown until progress hydrates. It is the real card's markup with
 * the text replaced by bars, so it reserves the correct height at every width
 * (including when the meta line wraps on a phone) instead of guessing one.
 */
function ContinuePlaceholder({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={className}>
      <Card className="flex items-center gap-4 p-5">
        <span className="size-10 shrink-0 rounded-full bg-muted" />
        <div className="min-w-0 flex-1 space-y-2">
          <span className="block h-3 w-28 rounded bg-muted" />
          <span className="block h-4 w-3/4 rounded bg-muted" />
          <span className="block h-3 w-1/2 rounded bg-muted" />
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

          <ArrowRight
            className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 ease-emphasis group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </div>
      </CardLink>
    </AnimatedSection>
  );
}
