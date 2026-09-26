"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { AnimatedCheck } from "@/components/animations/animated-check";
import { ProgressBar } from "@/components/progress/progress-bar";
import {
  cappedStagger,
  durations,
  easeInOut,
  itemVariants,
  staggerContainer,
  swapVariants,
  transitions,
} from "@/lib/motion";
import { findActive, TRACK_SHORT } from "@/lib/nav";
import { useProgress } from "@/lib/progress";
import { useMotionSafe } from "@/lib/use-motion";
import type { ChapterSummary, DomainGroup, TrackGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ChapterSidebarProps {
  groups: TrackGroup[];
  /** Called after any link click — the mobile drawer uses it to close itself. */
  onNavigate?: () => void;
  /**
   * Disambiguates the `layoutId`s of the active-row highlight, the accent bar and
   * the hover highlight. The desktop rail and the mobile drawer can be mounted at
   * the same time, and framer treats a shared layoutId as one travelling element.
   */
  instanceId?: string;
  /**
   * Cascade the track sections in on mount (L2). Only the drawer asks for it: the
   * desktop rail is there from first paint and has nothing to announce.
   */
  cascade?: boolean;
  className?: string;
}

const domainId = (track: string, domain: string) => `${track}/${domain}`;

/**
 * `true` once `value` differs from what it was on the first *hydrated* render.
 *
 * Progress arrives from localStorage a tick after mount, so that first jump is
 * state loading rather than the reader finishing something. Without this baseline
 * a rail of 70 ticks would draw themselves — and every counter would swap — on
 * every page load, which is the exact failure the draw is supposed to avoid.
 */
function useChangedSinceLoad(value: unknown, hydrated: boolean): boolean {
  const baseline = React.useRef<{ value: unknown } | null>(null);
  // Latched: once this row/counter has moved under the reader's own hand, later
  // moves are theirs too — un-completing and re-completing should draw again.
  const changed = React.useRef(false);
  if (hydrated && !baseline.current) baseline.current = { value };
  if (baseline.current && baseline.current.value !== value) changed.current = true;
  return changed.current;
}

export function ChapterSidebar({
  groups,
  onNavigate,
  instanceId = "rail",
  cascade = false,
  className,
}: ChapterSidebarProps) {
  const pathname = usePathname();
  const motionSafe = useMotionSafe();
  const { hydrated, isComplete, countOf, percentOf } = useProgress();
  const active = React.useMemo(() => findActive(groups, pathname), [groups, pathname]);

  const activeDomainId =
    active.track && active.domain ? domainId(active.track.track, active.domain.domain.key) : null;

  // Tracks start open (the domain list is the map of the course); domains start
  // closed except the one you're in. Expanding is never undone automatically, so
  // the active indicator always has somewhere to travel from.
  const [openTracks, setOpenTracks] = React.useState<Set<string>>(
    () => new Set(groups.map((g) => g.track))
  );
  const [openDomains, setOpenDomains] = React.useState<Set<string>>(
    () => new Set(activeDomainId ? [activeDomainId] : [])
  );

  const activeTrackKey = active.track?.track ?? null;
  React.useEffect(() => {
    if (activeTrackKey) {
      setOpenTracks((prev) => (prev.has(activeTrackKey) ? prev : new Set(prev).add(activeTrackKey)));
    }
    if (activeDomainId) {
      setOpenDomains((prev) => (prev.has(activeDomainId) ? prev : new Set(prev).add(activeDomainId)));
    }
  }, [activeTrackKey, activeDomainId]);

  // Keep the current chapter visible in the rail without scrolling the page.
  const railRef = React.useRef<HTMLDivElement>(null);
  const activeRowRef = React.useRef<HTMLAnchorElement>(null);
  React.useEffect(() => {
    const rail = railRef.current;
    const row = activeRowRef.current;
    if (!rail || !row) return;
    // Measured with rects, not offsetTop: the row's offsetParent is its own
    // positioned <li>, so offsetTop would be ~0 and every navigation would
    // scroll the rail back to the top.
    const rowRect = row.getBoundingClientRect();
    const railRect = rail.getBoundingClientRect();
    const rowTop = rowRect.top - railRect.top + rail.scrollTop;
    const rowBottom = rowTop + rowRect.height;
    const viewTop = rail.scrollTop;
    const viewBottom = viewTop + rail.clientHeight;
    if (rowTop < viewTop + 24 || rowBottom > viewBottom - 24) {
      rail.scrollTop = Math.max(0, rowTop - rail.clientHeight / 2 + rowRect.height / 2);
    }
  }, [pathname]);

  // Memoised so the variant definition keeps a stable identity across the
  // re-renders every progress update causes; the cascade must run on mount only.
  const cascadeVariants = React.useMemo(
    () => (cascade ? staggerContainer(cappedStagger(groups.length), 0.08) : undefined),
    [cascade, groups.length]
  );

  const toggleTrack = (track: string) =>
    setOpenTracks((prev) => {
      const next = new Set(prev);
      if (next.has(track)) next.delete(track);
      else next.add(track);
      return next;
    });

  const toggleDomain = (id: string) =>
    setOpenDomains((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div
      ref={railRef}
      className={cn("scroll-rail relative h-full overflow-y-auto overscroll-contain", className)}
    >
      {/*
       * The cascade is declared here rather than on the drawer so the sections'
       * own container owns the stagger. Giving this nav an explicit initial/animate
       * also stops the drawer panel's variant labels propagating any further down.
       */}
      <motion.nav
        aria-label="Chapters"
        className="px-3 py-5"
        variants={cascadeVariants}
        initial={cascade && motionSafe ? "hidden" : false}
        animate={cascade ? "visible" : undefined}
      >
        {groups.map((group, groupIndex) => {
          const trackOpen = openTracks.has(group.track);
          const trackSlugs = group.domains.flatMap((d) => d.chapters.map((c) => c.slug));
          const done = hydrated ? countOf(trackSlugs) : 0;
          const percent = hydrated ? percentOf(trackSlugs) : 0;

          return (
            <motion.section
              key={group.track}
              variants={cascade ? itemVariants : undefined}
              className={cn(groupIndex > 0 && "mt-6 border-t border-border pt-6")}
            >
              <div className="flex items-center gap-1 px-1">
                <button
                  type="button"
                  onClick={() => toggleTrack(group.track)}
                  aria-expanded={trackOpen}
                  // Only referenced while the panel exists; AnimatePresence unmounts it.
                  aria-controls={trackOpen ? `track-${group.track}-${instanceId}` : undefined}
                  className="grid size-5 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Chevron open={trackOpen} />
                  <span className="sr-only">
                    {trackOpen ? "Collapse" : "Expand"} {TRACK_SHORT[group.track]} track
                  </span>
                </button>
                <Link
                  href={`/tracks/${group.track}`}
                  onClick={onNavigate}
                  className="eyebrow flex-1 truncate py-1 text-foreground/90 transition-colors hover:text-accent"
                >
                  {TRACK_SHORT[group.track]}
                </Link>
                {/* Static: the track's result is already reported by its bar below. */}
                <span className="font-mono text-2xs tabular text-muted-foreground">
                  {done}/{trackSlugs.length}
                </span>
              </div>

              <div className="mt-2 px-1">
                <ProgressBar
                  percent={percent}
                  height={2}
                  label={`${TRACK_SHORT[group.track]} track progress`}
                  fillClassName={
                    group.track === "foundation"
                      ? "bg-foundation"
                      : group.track === "professional"
                        ? "bg-professional"
                        : "bg-muted-foreground"
                  }
                />
              </div>

              <AnimatePresence initial={false}>
                {trackOpen && (
                  <motion.div
                    id={`track-${group.track}-${instanceId}`}
                    initial={motionSafe ? { height: 0, opacity: 0 } : false}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: durations.base, ease: easeInOut }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 space-y-0.5">
                      {group.domains.map((domainGroup) => (
                        <DomainSection
                          key={domainGroup.domain.key}
                          group={domainGroup}
                          open={openDomains.has(domainId(group.track, domainGroup.domain.key))}
                          onToggle={() => toggleDomain(domainId(group.track, domainGroup.domain.key))}
                          onNavigate={onNavigate}
                          instanceId={instanceId}
                          pathname={pathname}
                          activeSlug={active.chapter?.slug ?? null}
                          activeRowRef={activeRowRef}
                          isComplete={isComplete}
                          countOf={countOf}
                          hydrated={hydrated}
                          motionSafe={motionSafe}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          );
        })}
      </motion.nav>
    </div>
  );
}

/**
 * Disclosure chevron. A spring rather than a curve: the rotation is an
 * orientation answering a hand, and it settles inside L1.
 * `initial={false}` so a chevron that mounts already open doesn't spin into place.
 */
function Chevron({ open }: { open: boolean }) {
  return (
    <motion.span
      animate={{ rotate: open ? 90 : 0 }}
      initial={false}
      transition={transitions.indicator}
      className="grid place-items-center"
    >
      <ChevronRight className="size-3.5" aria-hidden="true" />
    </motion.span>
  );
}

/**
 * `n/m`, swapped in place when it changes (L1) — the domain counter is the one
 * thing in the rail that reports a result, so it earns the micro-transition.
 *
 * The slot reserves its width (mono + tabular, so digits never change it) because
 * `mode="wait"` leaves it empty for a frame and a collapsing counter would twitch
 * the row it sits in.
 */
function CountSwap({
  done,
  total,
  hydrated,
  className,
}: {
  done: number;
  total: number;
  hydrated: boolean;
  className?: string;
}) {
  const changed = useChangedSinceLoad(done, hydrated);

  return (
    <span
      className={cn("relative shrink-0 text-right font-mono text-2xs tabular", className)}
      style={{ minWidth: `${String(total).length * 2 + 1}ch` }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          // Key frozen until the first real change: the hydration jump from 0/n
          // is state arriving, not something the reader did.
          key={changed ? done : "load"}
          variants={swapVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="block"
        >
          {done}/{total}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

interface DomainSectionProps {
  group: DomainGroup;
  open: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  instanceId: string;
  pathname: string | null;
  activeSlug: string | null;
  activeRowRef: React.RefObject<HTMLAnchorElement>;
  isComplete: (slug: string) => boolean;
  countOf: (slugs: string[]) => number;
  hydrated: boolean;
  motionSafe: boolean;
}

function DomainSection({
  group,
  open,
  onToggle,
  onNavigate,
  instanceId,
  pathname,
  activeSlug,
  activeRowRef,
  isComplete,
  countOf,
  hydrated,
  motionSafe,
}: DomainSectionProps) {
  const href = `/tracks/${group.track}/${group.domain.key}`;
  const onDomainPage = pathname === href;
  const slugs = group.chapters.map((c) => c.slug);
  const done = hydrated ? countOf(slugs) : 0;
  const allDone = done === slugs.length && slugs.length > 0;
  const listId = `domain-${group.track}-${group.domain.key}-${instanceId}`;

  // The hover highlight travels within one domain list only — a highlight that
  // jumped the length of the rail would be chasing the pointer, not following it.
  const [hoveredSlug, setHoveredSlug] = React.useState<string | null>(null);
  const hoverLayoutId = `sidebar-hover-${instanceId}-${group.track}-${group.domain.key}`;

  return (
    <div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          className="grid size-5 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:text-foreground"
        >
          <Chevron open={open} />
          <span className="sr-only">
            {open ? "Collapse" : "Expand"} {group.domain.title}
          </span>
        </button>
        <Link
          href={href}
          onClick={onNavigate}
          aria-current={onDomainPage ? "page" : undefined}
          className={cn(
            "flex-1 truncate rounded-md px-1.5 py-1.5 text-[0.8125rem] leading-tight transition-colors",
            onDomainPage
              ? "font-medium text-accent"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          )}
        >
          {group.domain.title}
        </Link>
        <CountSwap
          done={done}
          total={slugs.length}
          hydrated={hydrated}
          className={allDone ? "text-success" : "text-muted-foreground"}
        />
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={motionSafe ? { height: 0, opacity: 0 } : false}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: durations.base, ease: easeInOut }}
            className="ml-[0.9375rem] overflow-hidden"
          >
            <ul
              id={listId}
              className="mt-0.5 border-l border-border pl-1"
              onPointerLeave={() => setHoveredSlug(null)}
            >
              {group.chapters.map((chapter) => (
                <ChapterRow
                  key={chapter.slug}
                  chapter={chapter}
                  isActive={activeSlug === chapter.slug}
                  complete={hydrated && isComplete(chapter.slug)}
                  hydrated={hydrated}
                  hovered={hoveredSlug === chapter.slug}
                  onHover={() => setHoveredSlug(chapter.slug)}
                  onNavigate={onNavigate}
                  activeRowRef={activeRowRef}
                  instanceId={instanceId}
                  hoverLayoutId={hoverLayoutId}
                />
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ChapterRowProps {
  chapter: ChapterSummary;
  isActive: boolean;
  complete: boolean;
  hydrated: boolean;
  hovered: boolean;
  onHover: () => void;
  onNavigate?: () => void;
  activeRowRef: React.RefObject<HTMLAnchorElement>;
  instanceId: string;
  hoverLayoutId: string;
}

function ChapterRow({
  chapter,
  isActive,
  complete,
  hydrated,
  hovered,
  onHover,
  onNavigate,
  activeRowRef,
  instanceId,
  hoverLayoutId,
}: ChapterRowProps) {
  // Draw the tick only for a completion that happened while this row was on
  // screen; anything already ticked at load renders as a finished mark.
  const completionChanged = useChangedSinceLoad(complete, hydrated);
  const justCompleted = complete && completionChanged;

  return (
    <li
      className="relative isolate"
      // pointerType filter: on touch, `pointerenter` fires on tap and would leave
      // a highlight sitting on a row nobody is pointing at.
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") onHover();
      }}
    >
      {/* Travelling hover highlight (L2). Rendered under the active pill and on a
          separate layoutId so the two never fight over one element; it simply
          stops existing when the pointer leaves the list. */}
      {hovered && (
        <motion.span
          layoutId={hoverLayoutId}
          transition={transitions.indicator}
          className="absolute inset-0 z-[-2] rounded-md bg-muted/70"
          aria-hidden="true"
        />
      )}
      {isActive && (
        <>
          {/* The whole row's highlight slides, not just the bar — same spring, so
              pill and bar arrive as one movement. */}
          <motion.span
            layoutId={`sidebar-active-${instanceId}`}
            transition={transitions.indicator}
            className="absolute inset-0 z-[-1] rounded-md bg-accent/10"
            aria-hidden="true"
          />
          <motion.span
            layoutId={`sidebar-indicator-${instanceId}`}
            transition={transitions.indicator}
            className="absolute -left-[5px] top-1 h-[calc(100%-0.5rem)] w-[2px] rounded-full bg-accent"
            aria-hidden="true"
          />
        </>
      )}
      <Link
        ref={isActive ? activeRowRef : undefined}
        href={`/chapters/${chapter.slug}`}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "group/row flex items-center gap-2 rounded-md px-2 py-[0.3125rem] text-[0.8125rem] leading-snug transition-colors duration-[160ms] ease-emphasis",
          isActive
            ? "font-medium text-foreground"
            : "text-muted-foreground hover:text-foreground focus-visible:text-foreground"
        )}
      >
        <span
          className={cn(
            "w-[1.375rem] shrink-0 font-mono text-2xs tabular",
            isActive ? "text-accent" : "text-muted-foreground"
          )}
        >
          {chapter.chapterNumber}
        </span>
        {/* 2px lean toward the pointer (L1) — transform only, so the row cannot
            reflow. Focus-visible is paired so keyboard travel feels the same. */}
        <span className="min-w-0 flex-1 truncate transition-transform duration-[160ms] ease-emphasis group-hover/row:translate-x-[2px] group-focus-visible/row:translate-x-[2px]">
          {chapter.title}
        </span>
        {complete ? (
          <AnimatedCheck
            size={12}
            instant={!justCompleted}
            className="text-success"
            aria-label="Completed"
          />
        ) : (
          <span className="size-1 shrink-0 rounded-full bg-border-strong/70" aria-hidden="true" />
        )}
      </Link>
    </li>
  );
}
