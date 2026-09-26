"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { ProgressBar } from "@/components/progress/progress-bar";
import { CardLink } from "@/components/ui/card";
import { TRACK_COLOR, TRACK_SHORT } from "@/lib/nav";
import { useProgress } from "@/lib/progress";
import { TRACK_DESCRIPTIONS, TRACK_LABELS, type Track } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * A domain reduced to what a progress readout needs. Shared with
 * `DomainProgress` so both derive their counts from the same shape.
 */
export interface TrackDomainProgress {
  key: string;
  title: string;
  slugs: string[];
}

export interface TrackCardProps {
  track: Track;
  domains: TrackDomainProgress[];
  chapterCount: number;
  /** Single-row variant for the small Core track — no dek, no domain breakdown. */
  compact?: boolean;
  className?: string;
}

export function TrackCard({
  track,
  domains,
  chapterCount,
  compact = false,
  className,
}: TrackCardProps) {
  const { hydrated, countOf, percentOf } = useProgress();
  const hue = TRACK_COLOR[track];

  const slugs = React.useMemo(() => domains.flatMap((d) => d.slugs), [domains]);
  const done = hydrated ? countOf(slugs) : 0;
  const percent = hydrated ? percentOf(slugs) : 0;

  const counts = (
    <span className="font-mono text-2xs tabular text-muted-foreground">
      {done}
      <span className="text-muted-foreground">/{chapterCount}</span>
    </span>
  );

  if (compact) {
    return (
      <CardLink
        href={`/tracks/${track}`}
        className={cn("group flex items-center gap-4 p-4 sm:gap-5", className)}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className={cn("size-1.5 shrink-0 rounded-full", hue?.bg)} aria-hidden="true" />
          <span className="truncate text-sm font-semibold tracking-display">
            {TRACK_LABELS[track]}
          </span>
        </span>
        <ProgressBar
          percent={percent}
          height={4}
          className="max-w-[14rem] flex-1"
          fillClassName={hue?.bg}
          label={`${TRACK_SHORT[track]} track progress`}
        />
        {counts}
        <span className="eyebrow hidden shrink-0 sm:inline">{domains.length} domains</span>
        <ArrowRight
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 ease-emphasis group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </CardLink>
    );
  }

  return (
    <CardLink href={`/tracks/${track}`} className={cn("group flex h-full flex-col p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <span className={cn("size-1.5 shrink-0 rounded-full", hue?.bg)} aria-hidden="true" />
          <span className={cn("eyebrow", hue?.text)}>{TRACK_SHORT[track]}</span>
        </span>
        {counts}
      </div>

      <h3 className="mt-3 text-base font-semibold tracking-display sm:text-lg">
        {TRACK_LABELS[track]}
      </h3>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
        {TRACK_DESCRIPTIONS[track]}
      </p>

      <ProgressBar
        percent={percent}
        height={6}
        className="mt-4"
        fillClassName={hue?.bg}
        label={`${TRACK_SHORT[track]} track progress`}
      />
      <p className="eyebrow mt-2.5 flex items-center justify-between">
        <span>{chapterCount} chapters</span>
        <span>{domains.length} domains</span>
      </p>

      {/* Mini breakdown. Plain text, not links — the card is already one link; the
          domain list further down the dashboard carries the navigation. */}
      <ul className="mt-auto space-y-2 border-t border-border pt-4">
        {domains.map((domain) => {
          const domainDone = hydrated ? countOf(domain.slugs) : 0;
          const domainPercent = hydrated ? percentOf(domain.slugs) : 0;
          return (
            <li key={domain.key} className="flex items-center gap-3 text-[0.8125rem]">
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{domain.title}</span>
              <ProgressBar
                percent={domainPercent}
                height={2}
                className="w-10 shrink-0 sm:w-14"
                fillClassName={hue?.bg}
                label={`${domain.title}: ${domainPercent}%`}
              />
              <span className="w-[2.75rem] shrink-0 text-right font-mono text-2xs tabular text-muted-foreground">
                {domainDone}/{domain.slugs.length}
              </span>
            </li>
          );
        })}
      </ul>
    </CardLink>
  );
}
