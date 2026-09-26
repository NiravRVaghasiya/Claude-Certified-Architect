import * as React from "react";
import { Clock } from "lucide-react";
import { AnimatedSection } from "@/components/animations/animated-section";
import { MarkCompleteButton } from "@/components/progress/mark-complete-button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { chapterDek } from "@/lib/dek";
import { TRACK_SHORT } from "@/lib/nav";
import type { ChapterSummary, Track } from "@/lib/types";

const TRACK_BADGE: Record<Track, NonNullable<BadgeProps["variant"]>> = {
  core: "neutral",
  foundation: "foundation",
  professional: "professional",
};

/** 12345 → "12,345", without depending on the runtime's locale. */
function formatCount(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function MetaDot() {
  return <span className="size-1 shrink-0 rounded-full bg-border-strong" aria-hidden="true" />;
}

/**
 * Chapter title block: identity (number + track), title, dek, then a single
 * metadata line. The metadata reveals a beat after the title so the page reads
 * top-down on first paint.
 */
export function ChapterHeader({ chapter }: { chapter: ChapterSummary }) {
  const dek = chapterDek(chapter.dek);
  const sectionCount = chapter.sections.length;

  return (
    <AnimatedSection as="header" immediate>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="eyebrow text-accent">Chapter {chapter.chapterNumber}</span>
        <Badge variant={TRACK_BADGE[chapter.track]} size="sm" mono>
          {TRACK_SHORT[chapter.track]}
        </Badge>
      </div>

      <h1 className="mt-3 text-fluid-2xl font-semibold tracking-display">{chapter.title}</h1>

      {dek && <p className="mt-4 text-fluid-base text-muted-foreground">{dek}</p>}

      <AnimatedSection
        immediate
        tight
        delay={0.08}
        className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-3 border-t border-border pt-4"
      >
        <span className="eyebrow flex items-center gap-1.5">
          <Clock className="size-3" aria-hidden="true" />
          <span className="tabular">{chapter.readingTime}</span> min read
        </span>
        <MetaDot />
        <span className="eyebrow tabular">{formatCount(chapter.wordCount)} words</span>
        <MetaDot />
        <span className="eyebrow tabular">
          {sectionCount} {sectionCount === 1 ? "section" : "sections"}
        </span>
        <MarkCompleteButton slug={chapter.slug} className="ml-auto" />
      </AnimatedSection>
    </AnimatedSection>
  );
}
