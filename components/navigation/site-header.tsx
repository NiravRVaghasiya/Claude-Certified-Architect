"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Magnetic } from "@/components/animations/magnetic";
import { LogoMark } from "@/components/navigation/logo";
import { MobileNavigation } from "@/components/navigation/mobile-navigation";
import { SearchCommand } from "@/components/search/search-command";
import { ProgressRing } from "@/components/progress/progress-ring";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { swapVariants, transitions } from "@/lib/motion";
import { findActive, slugsOf, TRACK_COLOR, TRACK_SHORT } from "@/lib/nav";
import { useProgress } from "@/lib/progress";
import { useMotionSafe, useScrolled } from "@/lib/use-motion";
import type { TrackGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

const MotionLink = motion.create(Link);

/**
 * Sticky product header.
 *
 * The header is `fixed` and the shell reserves a constant `--header-h` of space,
 * so the compaction on scroll (row 64px → 56px, the surface arriving, the domain
 * label dropping out) never moves page content. An 8px gradient below the row
 * masks content passing under the compacted bar.
 */
export function SiteHeader({
  groups,
  chapterCount,
}: {
  groups: TrackGroup[];
  chapterCount: number;
}) {
  const pathname = usePathname();
  const scrolled = useScrolled(6);
  const motionSafe = useMotionSafe();
  const { hydrated, countOf, percentOf } = useProgress();

  const allSlugs = React.useMemo(() => slugsOf(groups), [groups]);
  const active = React.useMemo(() => findActive(groups, pathname), [groups, pathname]);
  const percent = hydrated ? percentOf(allSlugs) : 0;
  const done = hydrated ? countOf(allSlugs) : 0;

  const trackKey = active.track?.track ?? null;
  const domain = active.domain?.domain ?? null;
  const showDomain = Boolean(domain) && !scrolled;

  // Height, surface and mask share one transition so compaction lands as a single
  // L2 event rather than three cues with their own timings.
  const compaction = motionSafe ? transitions.base : { duration: 0 };

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <motion.div
        animate={{ height: scrolled ? 56 : 64 }}
        initial={false}
        transition={compaction}
        className="relative"
      >
        {/* Hairline, blur and fill live on one layer and arrive as one opacity
            change: separate CSS transitions per property read as the header
            settling in stages. Absolute, so the border costs no layout. */}
        <motion.div
          aria-hidden="true"
          initial={false}
          animate={{ opacity: scrolled ? 1 : 0 }}
          transition={compaction}
          className="absolute inset-0 border-b border-border bg-background/80 shadow-xs backdrop-blur-md supports-[backdrop-filter]:bg-background/70"
        />

        <div className="relative flex h-full items-center gap-2 px-3 sm:gap-3 sm:px-5">
          <MobileNavigation groups={groups} />

          {/* `rest`/`hover` drive the accent rule inside LogoMark through motion
              context — whileFocus included so the flourish isn't pointer-only. */}
          <MotionLink
            href="/"
            initial="rest"
            whileHover="hover"
            whileFocus="hover"
            className="flex items-center gap-2 rounded-md py-1 pr-1 text-foreground"
            aria-label="CCAR Study Guide — home"
          >
            <LogoMark />
            <span className="text-sm font-semibold tracking-display">CCAR</span>
            <span className="hidden text-sm text-muted-foreground sm:inline">Study Guide</span>
          </MotionLink>

          {/* Track / domain indicator — where you are, without a second breadcrumb row. */}
          <div className="hidden min-w-0 items-center gap-2 md:flex">
            <span className="h-4 w-px bg-border" aria-hidden="true" />
            {trackKey ? (
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex shrink-0 items-center gap-1.5">
                  <LocationDot on={!showDomain} colorClassName={TRACK_COLOR[trackKey]?.bg} />
                  <span className="eyebrow text-foreground/80">{TRACK_SHORT[trackKey]}</span>
                </span>
                <span className="flex min-w-0 items-center gap-1.5">
                  <LocationDot on={showDomain} colorClassName={TRACK_COLOR[trackKey]?.bg} />
                  {/* Keyed on the domain so moving between domains reads as a
                      change of place (L1 swap) instead of a text flicker. The dot
                      sits outside the swap, or it would blink out mid-exit. */}
                  <AnimatePresence mode="wait" initial={false}>
                    {showDomain && domain && (
                      <motion.span
                        key={domain.key}
                        variants={swapVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="block min-w-0 truncate text-xs text-muted-foreground"
                      >
                        {domain.title}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </div>
            ) : (
              <span className="eyebrow">{chapterCount} chapters</span>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <SearchCommand />
            {/* 2px only: an icon control should feel weighted toward the cursor,
                not chase it. No tap props on the wrapper — framer gives any element
                with a tap gesture `tabIndex=0`, which would put two nameless tab
                stops in the header. The press feedback belongs to the control. */}
            <Magnetic strength={2}>
              <ThemeToggle />
            </Magnetic>
            <Magnetic strength={2}>
              <Link
                href="/#progress"
                className="flex items-center gap-2 rounded-md py-1 pl-1 pr-1.5 transition-colors duration-[160ms] ease-emphasis hover:bg-muted active:scale-[0.97]"
                aria-label={`Overall progress: ${done} of ${allSlugs.length} chapters complete`}
              >
                {/* Width reserved: `done` is 0 until localStorage lands, and this
                    sits in the header's right-hand group where a 1ch change would
                    shift every control beside it. */}
                <span className="hidden min-w-[5ch] text-right font-mono text-2xs tabular text-muted-foreground sm:inline">
                  {done}
                  <span className="text-muted-foreground">/{allSlugs.length}</span>
                </span>
                <ProgressRing percent={percent} size={26} strokeWidth={2.5} showValue={false} />
              </Link>
            </Magnetic>
          </div>
        </div>
      </motion.div>

      {/* Masks content scrolling through the gap left by the compacted row. */}
      <motion.div
        aria-hidden="true"
        animate={{ opacity: scrolled ? 1 : 0 }}
        initial={false}
        transition={compaction}
        className="h-2 bg-gradient-to-b from-background/80 to-transparent"
      />
    </header>
  );
}

/**
 * The dot that marks the deepest level you are actually in: the track when that
 * is all we know, the domain when the row is wide enough to name it.
 *
 * One `layoutId` across both slots, so going deeper — or compacting the header —
 * slides the same dot instead of cross-fading a second one into existence. The
 * slot is reserved in both places, so the labels beside it never reflow while the
 * dot is travelling.
 */
function LocationDot({ on, colorClassName }: { on: boolean; colorClassName?: string }) {
  return (
    <span className="relative size-1.5 shrink-0" aria-hidden="true">
      {on && (
        <motion.span
          layoutId="header-location-dot"
          transition={transitions.indicator}
          className={cn("absolute inset-0 rounded-full", colorClassName ?? "bg-muted-foreground")}
        />
      )}
    </span>
  );
}
