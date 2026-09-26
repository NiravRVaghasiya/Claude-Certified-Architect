"use client";

import { MotionConfig } from "framer-motion";
import { transitions } from "@/lib/motion";

/**
 * App-wide motion defaults.
 *
 * `reducedMotion="user"` makes framer-motion drop transform/layout animations
 * for anyone with `prefers-reduced-motion: reduce` — values snap to their target
 * instead of animating, so state is still communicated, just without movement.
 * Components that own a whole interaction (page transitions, the mobile drawer)
 * additionally check `useMotionSafe()` and skip their animation wholesale.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={transitions.base}>
      {children}
    </MotionConfig>
  );
}
