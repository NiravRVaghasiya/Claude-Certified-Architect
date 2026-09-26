"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { AnimatedItem, AnimatedList } from "@/components/animations/animated-section";
import { ProgressBar } from "@/components/progress/progress-bar";
import type { TrackDomainProgress } from "@/components/dashboard/track-card";
import { TRACK_COLOR, TRACK_SHORT } from "@/lib/nav";
import { useProgress } from "@/lib/progress";
import type { Track } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface DomainProgressTrack {
  track: Track;
  domains: TrackDomainProgress[];
}

export interface DomainProgressProps {
  tracks: DomainProgressTrack[];
  className?: string;
}

/**
 * Dense every-domain readout: one row per domain with a 2px bar and its count,
 * grouped under its track. The rows are the fastest way into a specific domain,
 * so they stay real links rather than hover-revealed affordances.
 */
export function DomainProgress({ tracks, className }: DomainProgressProps) {
  const { hydrated, countOf, percentOf } = useProgress();

  return (
    <div className={cn("space-y-8", className)}>
      {tracks.map((group) => {
        const hue = TRACK_COLOR[group.track];
        const slugs = group.domains.flatMap((d) => d.slugs);
        const done = hydrated ? countOf(slugs) : 0;

        return (
          <section key={group.track} aria-labelledby={`domain-progress-${group.track}`}>
            <div className="flex items-center gap-3">
              <div className="flex shrink-0 items-center gap-2">
                <span className={cn("size-1.5 rounded-full", hue?.bg)} aria-hidden="true" />
                <h3 id={`domain-progress-${group.track}`} className={cn("eyebrow", hue?.text)}>
                  {TRACK_SHORT[group.track]}
                </h3>
              </div>
              <span className="h-px flex-1 bg-border" aria-hidden="true" />
              <span className="shrink-0 font-mono text-2xs tabular text-muted-foreground">
                {done}
                <span className="text-muted-foreground">/{slugs.length}</span>
              </span>
            </div>

            <AnimatedList as="ul" stagger={0.05} className="mt-2">
              {group.domains.map((domain) => {
                const domainDone = hydrated ? countOf(domain.slugs) : 0;
                const domainPercent = hydrated ? percentOf(domain.slugs) : 0;
                const complete = domain.slugs.length > 0 && domainDone === domain.slugs.length;

                return (
                  <AnimatedItem as="li" key={domain.key} tight>
                    <Link
                      href={`/tracks/${group.track}/${domain.key}`}
                      className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <span className="min-w-0 flex-1 truncate text-[0.8125rem] text-foreground/90">
                        {domain.title}
                      </span>
                      <ProgressBar
                        percent={domainPercent}
                        height={2}
                        className="w-16 shrink-0 sm:w-28"
                        fillClassName={hue?.bg}
                        label={`${domain.title}: ${domainPercent}%`}
                      />
                      <span className="flex w-[3.5rem] shrink-0 items-center justify-end gap-1">
                        {complete && (
                          <Check className="size-3 text-success" aria-label="Domain complete" />
                        )}
                        <span
                          className={cn(
                            "font-mono text-2xs tabular",
                            complete ? "text-success" : "text-muted-foreground"
                          )}
                        >
                          {domainDone}/{domain.slugs.length}
                        </span>
                      </span>
                    </Link>
                  </AnimatedItem>
                );
              })}
            </AnimatedList>
          </section>
        );
      })}
    </div>
  );
}
