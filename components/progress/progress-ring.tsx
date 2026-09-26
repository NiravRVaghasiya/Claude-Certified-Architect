"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { durations, easeOut } from "@/lib/motion";
import { useMotionSafe } from "@/lib/use-motion";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  /** Tailwind text color class — the ring inherits it via `stroke="currentColor"`. */
  colorClassName?: string;
  /** Hide the inline percentage (for small rings used as pure indicators). */
  showValue?: boolean;
  label?: string;
  /** Swap the number for a check once complete. */
  checkOnComplete?: boolean;
}

export function ProgressRing({
  percent,
  size = 52,
  strokeWidth = 4,
  className,
  colorClassName = "text-accent",
  showValue = true,
  label,
  checkOnComplete = false,
}: ProgressRingProps) {
  const motionSafe = useMotionSafe();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference - (clamped / 100) * circumference;
  const complete = clamped >= 100;

  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? `${Math.round(clamped)}% complete`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-border"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke="currentColor"
          className={cn("transition-colors duration-300", complete ? "text-success" : colorClassName)}
          strokeDasharray={circumference}
          initial={motionSafe ? { strokeDashoffset: circumference } : false}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: durations.progress, ease: easeOut }}
        />
      </svg>
      {showValue && (
        <span className="absolute font-mono text-[0.625rem] font-semibold tabular">
          {checkOnComplete && complete ? (
            <Check className="size-3.5 text-success" aria-hidden="true" />
          ) : (
            `${Math.round(clamped)}`
          )}
        </span>
      )}
    </div>
  );
}
