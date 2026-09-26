"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { checkDraw, pulseVariants } from "@/lib/motion";
import { useMotionSafe } from "@/lib/use-motion";
import { cn } from "@/lib/utils";

interface AnimatedCheckProps {
  /** Size in px (matches lucide's sizing so it can stand in for `<Check/>`). */
  size?: number;
  className?: string;
  /** Marks the "just completed" moment with one expanding ring. Never loops. */
  pulse?: boolean;
  /** Skip the draw (for a check that was already true when it mounted). */
  instant?: boolean;
  "aria-label"?: string;
}

/**
 * A check that draws itself.
 *
 * The stroke animates `pathLength` 0 → 1, so completion reads as a mark being
 * made rather than an icon appearing — the one place in the app where the
 * animation carries meaning instead of decorating it. Under reduced motion the
 * path renders complete immediately, which is exactly the right static state.
 */
export function AnimatedCheck({
  size = 16,
  className,
  pulse = false,
  instant = false,
  "aria-label": ariaLabel,
}: AnimatedCheckProps) {
  const motionSafe = useMotionSafe();
  const animate = motionSafe && !instant;

  return (
    <span
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      {pulse && motionSafe && (
        <motion.span
          className="absolute inset-0 rounded-full bg-current"
          variants={pulseVariants}
          initial="hidden"
          animate="visible"
        />
      )}
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="relative"
      >
        <motion.path
          d="M20 6 9 17l-5-5"
          variants={checkDraw}
          initial={animate ? "hidden" : false}
          animate="visible"
        />
      </svg>
    </span>
  );
}
