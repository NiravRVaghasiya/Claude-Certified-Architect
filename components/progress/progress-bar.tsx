"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { durations, easeOut } from "@/lib/motion";
import { useMotionSafe } from "@/lib/use-motion";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  percent: number;
  className?: string;
  /** Tailwind background class for the fill. */
  fillClassName?: string;
  /** Track height in px. 2–3px for rails, 6px for cards. */
  height?: number;
  label?: string;
  delay?: number;
}

/**
 * Animated progress bar.
 *
 * The fill is animated with `scaleX` (compositor-only) rather than `width`, and
 * the track clips it — so the left cap stays rounded and no layout runs per frame.
 */
export function ProgressBar({
  percent,
  className,
  fillClassName = "bg-accent",
  height = 6,
  label,
  delay = 0,
}: ProgressBarProps) {
  const motionSafe = useMotionSafe();
  const clamped = Math.max(0, Math.min(100, percent));
  const complete = clamped >= 100;

  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-muted", className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? `${Math.round(clamped)}% complete`}
    >
      <motion.div
        className={cn(
          "h-full w-full origin-left rounded-full transition-colors duration-300",
          complete ? "bg-success" : fillClassName
        )}
        initial={motionSafe ? { scaleX: 0 } : false}
        animate={{ scaleX: clamped / 100 }}
        transition={{ duration: durations.progress, delay, ease: easeOut }}
      />
    </div>
  );
}
