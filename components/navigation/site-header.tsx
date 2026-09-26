"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LogoMark } from "@/components/navigation/logo";
import { MobileNavigation } from "@/components/navigation/mobile-navigation";
import { SearchCommand } from "@/components/search/search-command";
import { ProgressRing } from "@/components/progress/progress-ring";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { durations, transitions } from "@/lib/motion";
import { findActive, slugsOf, TRACK_COLOR, TRACK_SHORT } from "@/lib/nav";
import { useProgress } from "@/lib/progress";
import { useMotionSafe, useScrolled } from "@/lib/use-motion";
import type { TrackGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Sticky product header.
 *
 * The header is `fixed` and the shell reserves a constant `--header-h` of space,
 * so the compaction on scroll (row 64px → 56px, border and blur fading in, the
 * domain label dropping out) never moves page content. An 8px gradient below the
 * row masks content passing under the compacted bar.
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

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <motion.div
        animate={{ height: scrolled ? 56 : 64 }}
        initial={false}
        transition={motionSafe ? transitions.base : { duration: 0 }}
        className={cn(
          "flex items-center gap-2 px-3 transition-[background-color,border-color,box-shadow] duration-300 sm:gap-3 sm:px-5",
          scrolled
            ? "border-b border-border bg-background/80 shadow-xs backdrop-blur-md supports-[backdrop-filter]:bg-background/70"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <MobileNavigation groups={groups} />

        <Link
          href="/"
          className="group flex items-center gap-2 rounded-md py-1 pr-1 text-foreground"
          aria-label="CCAR Study Guide — home"
        >
          <LogoMark className="transition-transform duration-200 ease-emphasis group-hover:-rotate-3" />
          <span className="text-sm font-semibold tracking-display">CCAR</span>
          <span className="hidden text-sm text-muted-foreground sm:inline">Study Guide</span>
        </Link>

        {/* Track / domain indicator — where you are, without a second breadcrumb row. */}
        <div className="hidden min-w-0 items-center gap-2 md:flex">
          <span className="h-4 w-px bg-border" aria-hidden="true" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={trackKey ?? "overview"}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: durations.fast }}
              className="flex min-w-0 items-center gap-2"
            >
              {trackKey ? (
                <>
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn("size-1.5 rounded-full", TRACK_COLOR[trackKey]?.bg)}
                      aria-hidden="true"
                    />
                    <span className="eyebrow text-foreground/80">{TRACK_SHORT[trackKey]}</span>
                  </span>
                  <AnimatePresence initial={false}>
                    {active.domain && !scrolled && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: durations.fast }}
                        className="min-w-0 truncate text-xs text-muted-foreground"
                      >
                        {active.domain.domain.title}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <span className="eyebrow">{chapterCount} chapters</span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <SearchCommand />
          <ThemeToggle />
          <Link
            href="/#progress"
            className="flex items-center gap-2 rounded-md py-1 pl-1 pr-1.5 transition-colors hover:bg-muted"
            aria-label={`Overall progress: ${done} of ${allSlugs.length} chapters complete`}
          >
            <span className="hidden font-mono text-2xs tabular text-muted-foreground sm:inline">
              {done}
              <span className="text-muted-foreground">/{allSlugs.length}</span>
            </span>
            <ProgressRing percent={percent} size={26} strokeWidth={2.5} showValue={false} />
          </Link>
        </div>
      </motion.div>

      {/* Masks content scrolling through the gap left by the compacted row. */}
      <motion.div
        aria-hidden="true"
        animate={{ opacity: scrolled ? 1 : 0 }}
        initial={false}
        transition={{ duration: durations.base }}
        className="h-2 bg-gradient-to-b from-background/80 to-transparent"
      />
    </header>
  );
}
