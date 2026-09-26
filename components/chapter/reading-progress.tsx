"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { transitions } from "@/lib/motion";
import { useMotionSafe } from "@/lib/use-motion";
import { cn } from "@/lib/utils";

/**
 * Hairline reading-progress bar pinned above the header.
 *
 * Fixed and `scaleX`-driven, so it never participates in layout and never costs
 * a reflow. Purely decorative (the chapter's own progress is communicated by the
 * mark-complete control), hence aria-hidden.
 */
export function ReadingProgress({ className }: { className?: string }) {
  const motionSafe = useMotionSafe();
  const { scrollYProgress } = useScroll();
  const { stiffness, damping, mass } = transitions.indicator;
  const smoothed = useSpring(scrollYProgress, { stiffness, damping, mass });

  return (
    <motion.div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-accent",
        className
      )}
      style={{ scaleX: motionSafe ? smoothed : scrollYProgress }}
    />
  );
}
