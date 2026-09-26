"use client";

import { Check } from "lucide-react";
import { ProgressRing } from "@/components/progress/progress-ring";
import { Badge } from "@/components/ui/badge";
import { CardLink } from "@/components/ui/card";
import { TRACK_COLOR } from "@/lib/nav";
import { useProgress } from "@/lib/progress";
import type { Track } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface DomainCardProps {
  track: Track;
  domainKey: string;
  title: string;
  chapterSlugs: string[];
  className?: string;
}

/** Grid tile for one domain: ring, title, chapter count. Used by the track page. */
export function DomainCard({ track, domainKey, title, chapterSlugs, className }: DomainCardProps) {
  const { hydrated, countOf, percentOf } = useProgress();
  const total = chapterSlugs.length;
  const done = hydrated ? countOf(chapterSlugs) : 0;
  const percent = hydrated ? percentOf(chapterSlugs) : 0;
  const complete = total > 0 && done === total;

  return (
    <CardLink
      href={`/tracks/${track}/${domainKey}`}
      className={cn("flex h-full flex-col p-5", complete && "border-success/30", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">Domain</p>
          <h3 className="mt-1.5 text-[0.9375rem] font-semibold leading-snug tracking-display">
            {title}
          </h3>
        </div>
        <ProgressRing
          percent={percent}
          size={44}
          strokeWidth={4}
          checkOnComplete
          colorClassName={TRACK_COLOR[track]?.ring}
          label={`${title}: ${done} of ${total} chapters complete`}
        />
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="eyebrow">{total} chapters</span>
        {complete ? (
          <Badge variant="success" size="sm" mono>
            <Check aria-hidden="true" />
            Done
          </Badge>
        ) : (
          <span className="font-mono text-2xs tabular text-muted-foreground">
            {done}
            <span className="text-muted-foreground">/{total}</span>
          </span>
        )}
      </div>
    </CardLink>
  );
}
