"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { pageVariants } from "@/lib/motion";
import { useMotionSafe } from "@/lib/use-motion";

/**
 * Route-level transition: a short fade + 8px rise, ~240ms.
 *
 * Mounted from `app/template.tsx`, which Next re-renders on every navigation, so
 * each route gets a fresh enter animation. (The App Router has no exit phase for
 * route content — exits belong to the components that own them, e.g. the drawer
 * and the command palette, via AnimatePresence.)
 *
 * The *first* load deliberately does not animate. A reveal there would have to
 * serialise `opacity: 0` into the prerendered HTML, which would blank the page
 * until framer-motion hydrated — pushing out LCP, and leaving the content
 * permanently invisible if the bundle never arrives. `firstPaint` is module
 * state, so it is false during SSR and on the first client render (they agree,
 * so no hydration mismatch) and true for every navigation afterwards.
 *
 * The wrapper element itself is always rendered: branching on motion preference
 * would change the DOM shape between server and client and invalidate hydration
 * for every reduced-motion visitor.
 */
let pastFirstPaint = false;

export function AnimatedPage({ children }: { children: React.ReactNode }) {
  const motionSafe = useMotionSafe();
  const animate = React.useRef(pastFirstPaint).current && motionSafe;

  React.useEffect(() => {
    pastFirstPaint = true;
  }, []);

  return (
    <motion.div
      data-animated=""
      initial={animate ? "initial" : false}
      animate="animate"
      variants={pageVariants}
    >
      {children}
    </motion.div>
  );
}
