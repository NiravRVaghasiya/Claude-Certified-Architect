"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { ProgressBar } from "@/components/progress/progress-bar";
import { durations, easeInOut, transitions } from "@/lib/motion";
import { findActive, TRACK_SHORT } from "@/lib/nav";
import { useProgress } from "@/lib/progress";
import { useMotionSafe } from "@/lib/use-motion";
import type { DomainGroup, TrackGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ChapterSidebarProps {
  groups: TrackGroup[];
  /** Called after any link click — the mobile drawer uses it to close itself. */
  onNavigate?: () => void;
  /**
   * Disambiguates the `layoutId` of the active-chapter indicator. The desktop
   * rail and the mobile drawer can be mounted at the same time, and framer
   * treats a shared layoutId as one travelling element.
   */
  instanceId?: string;
  className?: string;
}

const domainId = (track: string, domain: string) => `${track}/${domain}`;

export function ChapterSidebar({
  groups,
  onNavigate,
  instanceId = "rail",
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
      <nav aria-label="Chapters" className="px-3 py-5">
        {groups.map((group, groupIndex) => {
          const trackOpen = openTracks.has(group.track);
          const trackSlugs = group.domains.flatMap((d) => d.chapters.map((c) => c.slug));
          const done = hydrated ? countOf(trackSlugs) : 0;
          const percent = hydrated ? percentOf(trackSlugs) : 0;

          return (
            <section key={group.track} className={cn(groupIndex > 0 && "mt-6 border-t border-border pt-6")}>
              <div className="flex items-center gap-1 px-1">
                <button
                  type="button"
                  onClick={() => toggleTrack(group.track)}
                  aria-expanded={trackOpen}
                  // Only referenced while the panel exists; AnimatePresence unmounts it.
                  aria-controls={trackOpen ? `track-${group.track}-${instanceId}` : undefined}
                  className="grid size-5 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:text-foreground"
                >
                  <motion.span
                    animate={{ rotate: trackOpen ? 90 : 0 }}
                    transition={{ duration: durations.fast, ease: easeInOut }}
                    className="grid place-items-center"
                  >
                    <ChevronRight className="size-3.5" aria-hidden="true" />
                  </motion.span>
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
            </section>
          );
        })}
      </nav>
    </div>
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
          <motion.span
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ duration: durations.fast, ease: easeInOut }}
            className="grid place-items-center"
          >
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </motion.span>
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
        <span
          className={cn(
            "font-mono text-2xs tabular",
            allDone ? "text-success" : "text-muted-foreground"
          )}
        >
          {done}/{slugs.length}
        </span>
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
            <ul id={listId} className="mt-0.5 border-l border-border pl-1">
              {group.chapters.map((chapter) => {
                const chapterHref = `/chapters/${chapter.slug}`;
                const isActive = activeSlug === chapter.slug;
                const complete = hydrated && isComplete(chapter.slug);

                return (
                  <li key={chapter.slug} className="relative">
                    {isActive && (
                      <motion.span
                        layoutId={`sidebar-indicator-${instanceId}`}
                        className="absolute -left-[5px] top-1 h-[calc(100%-0.5rem)] w-[2px] rounded-full bg-accent"
                        transition={transitions.indicator}
                        aria-hidden="true"
                      />
                    )}
                    <Link
                      ref={isActive ? activeRowRef : undefined}
                      href={chapterHref}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-[0.3125rem] text-[0.8125rem] leading-snug transition-colors",
                        isActive
                          ? "bg-accent/10 font-medium text-foreground"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
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
                      <span className="min-w-0 flex-1 truncate">{chapter.title}</span>
                      {complete ? (
                        <Check className="size-3 shrink-0 text-success" role="img" aria-label="Completed" />
                      ) : (
                        <span
                          className="size-1 shrink-0 rounded-full bg-border-strong/70"
                          aria-hidden="true"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
