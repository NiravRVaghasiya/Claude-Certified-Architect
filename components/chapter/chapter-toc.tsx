"use client";

import * as React from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { ChevronDown, List } from "lucide-react";
import { durations, easeInOut, transitions } from "@/lib/motion";
import { useMotionSafe } from "@/lib/use-motion";
import type { SectionHeading } from "@/lib/types";
import { cn } from "@/lib/utils";

/* Distance below the fixed header at which a heading counts as "current". */
const SPY_OFFSET = 120;

export interface ChapterTOCProps {
  sections: SectionHeading[];
  /**
   * Disambiguates the `layoutId` of the active indicator: the desktop rail and
   * the mobile disclosure can be mounted at once, and framer would otherwise
   * treat one shared id as a single element travelling between them.
   */
  instanceId?: string;
  /** Renders as an "On this page" disclosure instead of a rail. */
  collapsible?: boolean;
  className?: string;
}

/**
 * Chapter outline with scroll-spy.
 *
 * The active row is marked by a single indicator that travels between rows, the
 * rail line carries a fill tied to document scroll, and every row stays a plain
 * anchor so the outline works without JS (globals.css gives anchored headings a
 * scroll-margin that clears the fixed header).
 */
export function ChapterTOC({
  sections,
  instanceId = "rail",
  collapsible = false,
  className,
}: ChapterTOCProps) {
  const motionSafe = useMotionSafe();
  const [activeId, setActiveId] = React.useState<string | null>(sections[0]?.id ?? null);
  const [open, setOpen] = React.useState(false);

  const { scrollYProgress } = useScroll();
  const { stiffness, damping, mass } = transitions.indicator;
  const smoothProgress = useSpring(scrollYProgress, { stiffness, damping, mass });

  React.useEffect(() => {
    if (sections.length === 0) return;
    const headings = sections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
          return;
        }
        // Nothing in the band: a section longer than the viewport, or the very
        // bottom of the page. Fall back to the last heading already passed.
        const passed = headings.filter((el) => el.getBoundingClientRect().top < SPY_OFFSET);
        const last = passed[passed.length - 1];
        if (last) setActiveId(last.id);
      },
      { rootMargin: "-96px 0px -66% 0px", threshold: 0 }
    );

    headings.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  if (sections.length === 0) return null;

  const list = (
    <div className="relative">
      {/* Rail: a hairline with a scroll-progress fill scaled from the top. */}
      <span className="absolute inset-y-0 left-0 w-px bg-border" aria-hidden="true" />
      <motion.span
        className="absolute inset-y-0 left-0 w-px origin-top bg-accent/40"
        style={{ scaleY: motionSafe ? smoothProgress : scrollYProgress }}
        aria-hidden="true"
      />
      <ul className="space-y-px">
        {sections.map((section) => {
          const active = section.id === activeId;
          return (
            <li key={section.id} className="relative">
              {active && (
                <motion.span
                  layoutId={`toc-indicator-${instanceId}`}
                  className="absolute left-0 top-1 h-[calc(100%-0.5rem)] w-[2px] rounded-full bg-accent"
                  transition={transitions.indicator}
                  aria-hidden="true"
                />
              )}
              <a
                href={`#${section.id}`}
                onClick={() => setOpen(false)}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "block rounded-r-md py-1 pl-3 pr-1 text-[0.8125rem] leading-snug",
                  "transition-colors duration-200 ease-emphasis",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  section.level === 3 && "pl-6 text-xs",
                  active
                    ? "font-medium text-accent"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="line-clamp-2">{section.title}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );

  if (collapsible) {
    const panelId = `toc-panel-${instanceId}`;
    return (
      <nav aria-label="Table of contents" className={cn("rounded-xl border border-border bg-card", className)}>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <List className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="eyebrow flex-1 text-foreground/90">On this page</span>
          <span className="font-mono text-2xs tabular text-muted-foreground">{sections.length}</span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: durations.fast, ease: easeInOut }}
            className="grid place-items-center text-muted-foreground"
          >
            <ChevronDown className="size-3.5" aria-hidden="true" />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id={panelId}
              initial={motionSafe ? { height: 0, opacity: 0 } : false}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: durations.base, ease: easeInOut }}
              className="overflow-hidden"
            >
              <div className="scroll-rail max-h-[50vh] overflow-y-auto overscroll-contain px-4 pb-4">
                {list}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    );
  }

  return (
    <nav aria-label="Table of contents" className={cn("min-w-0", className)}>
      <p className="eyebrow mb-3">On this page</p>
      <div className="scroll-rail max-h-[calc(100dvh-var(--header-h)-8rem)] overflow-y-auto overscroll-contain">
        {list}
      </div>
    </nav>
  );
}
