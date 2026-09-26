"use client";

import * as React from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { easeOut } from "@/lib/motion";
import { useMotionSafe } from "@/lib/use-motion";
import { cn } from "@/lib/utils";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

interface AnimatedNumberProps {
  value: number;
  /** Seconds. Counting should finish before the eye moves on. */
  duration?: number;
  delay?: number;
  suffix?: string;
  className?: string;
}

/**
 * Counts up to `value` once, driven entirely by a MotionValue — the number is
 * written straight to the DOM node, so no React re-render happens per frame.
 *
 * The server renders the final value (correct without JS, and for crawlers); the
 * count-up only starts on the client, and is skipped under reduced motion.
 */
export function AnimatedNumber({
  value,
  duration = 0.8,
  delay = 0,
  suffix = "",
  className,
}: AnimatedNumberProps) {
  const motionSafe = useMotionSafe();
  const count = useMotionValue(value);
  const rounded = useTransform(count, (latest) => `${Math.round(latest)}${suffix}`);

  useIsomorphicLayoutEffect(() => {
    if (!motionSafe) {
      count.set(value);
      return;
    }
    count.set(0);
    const controls = animate(count, value, { duration, delay, ease: easeOut });
    return () => controls.stop();
  }, [value, motionSafe, duration, delay, count]);

  return (
    <span className={cn("tabular", className)}>
      {/* The animated node is decorative — `aria-label` is ignored on a generic
          span, so assistive tech gets the settled value as real text instead. */}
      <motion.span aria-hidden="true">{rounded}</motion.span>
      <span className="sr-only">{`${value}${suffix}`}</span>
    </span>
  );
}
