"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { AnimatedItem, AnimatedList } from "@/components/animations/animated-section";
import { ProgressBar } from "@/components/progress/progress-bar";
import type { TrackDomainProgress } from "@/components/dashboard/track-card";
import { cappedStagger, transitions } from "@/lib/motion";
import { TRACK_COLOR, TRACK_SHORT } from "@/lib/nav";
import { useProgress } from "@/lib/progress";
import type { Track } from "@/lib/types";
import { useMounted } from "@/lib/use-motion";
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

  /*
   * One highlight for the whole list, relocated between rows with `layoutId` (L2).
   *
   * A per-row `hover:bg-*` blinks on and off twenty-odd times as the pointer runs
   * down the list; a single block that travels says "you are here, in one list"
   * instead. It is driven by React state, not by scroll or pointer coordinates, so
   * it re-renders once per row crossed rather than per frame — the spring does the
   * rest. The same state is set on focus, so the keyboard gets the highlight too.
   *
   * `useId` keeps the layoutId unique if this list is ever rendered twice on a page.
   */
  const highlightId = React.useId();
  const [activeRow, setActiveRow] = React.useState<string | null>(null);

  // Before hydration (and with JS off) the travelling block cannot exist, so the
  // rows fall back to a plain CSS hover. Swapped out rather than layered, or the
  // two highlights would both be visible once the state took over.
  const mounted = useMounted();

  return (
    <div
      className={cn("space-y-8", className)}
      // Leaving through the gap between two track groups never fires a row's own
      // pointer-leave, so the outer element is what actually clears the highlight.
      onPointerLeave={() => setActiveRow(null)}
    >
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

            {/* The group's only entrance: one capped cascade, so six rows or sixteen
                both land inside the 300ms L3 window. Nothing else in a row animates
                on arrival — this list is long, and per-row motion would read as a
                page that is still loading. */}
            <AnimatedList
              as="ul"
              stagger={cappedStagger(group.domains.length)}
              className="mt-2"
            >
              {group.domains.map((domain) => {
                const domainDone = hydrated ? countOf(domain.slugs) : 0;
                const domainPercent = hydrated ? percentOf(domain.slugs) : 0;
                const complete = domain.slugs.length > 0 && domainDone === domain.slugs.length;
                const rowKey = `${group.track}/${domain.key}`;

                return (
                  <AnimatedItem as="li" key={domain.key} tight>
                    <Link
                      href={`/tracks/${group.track}/${domain.key}`}
                      onPointerEnter={(event) => {
                        // A tap would otherwise park the highlight on the row the
                        // reader just navigated away from.
                        if (event.pointerType !== "touch") setActiveRow(rowKey);
                      }}
                      onPointerLeave={() => setActiveRow(null)}
                      onFocus={() => setActiveRow(rowKey)}
                      onBlur={() => setActiveRow(null)}
                      className={cn(
                        "relative isolate -mx-2 flex items-center gap-3 rounded-md px-2 py-2",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        !mounted && "transition-colors hover:bg-muted"
                      )}
                    >
                      {mounted && activeRow === rowKey && (
                        // `isolate` on the row confines this negative-z layer to the
                        // row's own stacking context: it paints above the row's
                        // background and below its text, with no wrapper span.
                        <motion.span
                          layoutId={highlightId}
                          transition={transitions.indicator}
                          className="absolute inset-0 -z-10 rounded-md bg-muted"
                          aria-hidden="true"
                        />
                      )}
                      <span className="min-w-0 flex-1 truncate text-[0.8125rem] text-foreground">
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
                        {/* Static tick, not a drawn one: twenty rows resolving at once
                            would be twenty strokes competing for the same glance. */}
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
