"use client";

import * as React from "react";
import { motion, motionValue, useScroll, useSpring, type MotionValue } from "framer-motion";
import { springConfigs } from "@/lib/motion";
import { useMotionSafe } from "@/lib/use-motion";
import { cn } from "@/lib/utils";

/**
 * How far the reader is through the chapter, 0 → 1.
 *
 * One measurement, shared. Three things in the reader are the same number — the
 * hairline at the top of the window, the TOC rail's fill, and the rail's
 * percentage readout — and they live in different branches of the page with no
 * common client parent to hang a provider on. Measuring the scroll once and
 * publishing the motion value keeps it to a single set of geometry reads and a
 * single spring; nothing subscribes through React, so scrolling never causes a
 * render.
 *
 * `<ReadingProgress/>` is the writer and mounts exactly once per chapter page.
 */
export const readingProgress: MotionValue<number> = motionValue(0);

/** `useLayoutEffect` without React's server-rendering warning. */
const useIsoLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/**
 * Hairline reading-progress bar pinned above the header, and the source of
 * `readingProgress` for the rest of the reader.
 *
 * Fixed and `scaleX`-driven, so it never participates in layout and never costs
 * a reflow. Purely decorative as a bar (the chapter's own progress is
 * communicated by the mark-complete control and the rail's readout), hence
 * aria-hidden.
 */
export function ReadingProgress({
  targetId = "chapter-article",
  className,
}: {
  /** Element whose scroll defines 0 → 1. Falls back to document progress if absent. */
  targetId?: string;
  className?: string;
}) {
  const motionSafe = useMotionSafe();

  // Resolved by id rather than handed in as a ref: the bar is fixed-positioned
  // and renders as a sibling of the article, so there is no ref to thread to it.
  // Declared above useScroll so it is populated before framer measures — layout
  // effects run in hook declaration order. If the element is missing, framer
  // falls back to document progress, which is the same number plus the page
  // furniture.
  const article = React.useRef<HTMLElement | null>(null);
  useIsoLayoutEffect(() => {
    article.current = document.getElementById(targetId);
  }, [targetId]);

  // Progress through the article, not the document: reporting 100% while the
  // reader is still scrolling through the footer would be a lie.
  const { scrollYProgress } = useScroll({
    target: article,
    offset: ["start start", "end end"],
  });

  // The spring only smooths the raw scroll — the value still has to track the
  // scrollbar, so with motion disabled the unlagged value is published instead.
  const smoothed = useSpring(scrollYProgress, springConfigs.scroll);
  const source = motionSafe ? smoothed : scrollYProgress;

  useIsoLayoutEffect(() => {
    // framer measures the target in its own effect, so at this point
    // `scrollYProgress` may still be 0 even though the window is scrolled. If it
    // is, wait for the first real value and *jump* the spring to it: letting the
    // spring animate there would sweep the hairline, the rail fill and the
    // percentage from 0 up to the true position on every restored scroll
    // position or back-navigation, which reads as progress being made.
    let seeded = window.scrollY === 0;
    if (seeded) readingProgress.jump(scrollYProgress.get());

    // Seeding watches the RAW value, not `source`: when `source` is the spring,
    // its first frame is already on its way from 0 and would be the wrong anchor.
    const unsubscribeRaw = scrollYProgress.on("change", (latest) => {
      if (seeded) return;
      seeded = true;
      smoothed.jump(latest);
      readingProgress.jump(latest);
    });

    const unsubscribeSource = source.on("change", (latest) => {
      if (!seeded) return;
      readingProgress.set(latest);
    });

    return () => {
      unsubscribeRaw();
      unsubscribeSource();
    };
  }, [source, smoothed, scrollYProgress]);

  return (
    <motion.div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-accent",
        className
      )}
      style={{ scaleX: readingProgress }}
    />
  );
}
