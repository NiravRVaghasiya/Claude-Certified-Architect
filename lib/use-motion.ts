"use client";

import * as React from "react";
import { useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";

/**
 * `true` when the user has NOT asked for reduced motion.
 *
 * Every non-essential animation in the app is gated on this. Components should
 * still render the same DOM either way — reduced motion removes movement, never
 * information or interactivity.
 */
export function useMotionSafe(): boolean {
  return !useReducedMotion();
}

/** `true` after hydration — for anything that reads the DOM/localStorage. */
export function useMounted(): boolean {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted;
}

/**
 * `true` once the window has scrolled past `threshold` px.
 *
 * Uses framer-motion's scroll motion value (one shared passive listener,
 * rAF-throttled) and only re-renders when the boolean actually flips.
 */
export function useScrolled(threshold = 8): boolean {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    // Covers restored scroll positions on mount (before the first scroll event).
    setScrolled(window.scrollY > threshold);
  }, [threshold]);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const next = latest > threshold;
    setScrolled((prev) => (prev === next ? prev : next));
  });

  return scrolled;
}
