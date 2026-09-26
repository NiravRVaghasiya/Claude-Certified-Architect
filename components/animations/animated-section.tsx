"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { fadeUp, fadeUpTight, revealViewport, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

const TAGS = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  header: motion.header,
  aside: motion.aside,
  ul: motion.ul,
  ol: motion.ol,
  li: motion.li,
  nav: motion.nav,
} as const;

type Tag = keyof typeof TAGS;

interface AnimatedSectionProps extends HTMLMotionProps<"div"> {
  as?: Tag;
  /** Seconds to hold before the reveal starts. Use to sequence header → meta → body. */
  delay?: number;
  /** Reveal immediately on mount instead of when scrolled into view. */
  immediate?: boolean;
  /** Smaller travel, for items inside an already-visible container. */
  tight?: boolean;
}

/**
 * One-shot entrance reveal. Fades and rises ~12px, then never animates again —
 * scrolling back up does not replay it, and nothing animates on re-render.
 */
export function AnimatedSection({
  as = "div",
  delay = 0,
  immediate = false,
  tight = false,
  children,
  transition,
  className,
  style,
  ...props
}: AnimatedSectionProps) {
  const Component = TAGS[as] as typeof motion.div;

  // On-mount reveals run as a CSS animation: `initial` would otherwise write
  // opacity:0 into the prerendered HTML and gate first paint on hydration.
  if (immediate) {
    return (
      <Component
        data-animated=""
        className={cn("reveal-in", className)}
        style={
          {
            "--reveal-delay": delay ? `${delay}s` : undefined,
            "--reveal-distance": tight ? "6px" : undefined,
            "--reveal-duration": tight ? "320ms" : undefined,
            ...(style as React.CSSProperties),
          } as React.CSSProperties
        }
        {...props}
      >
        {children}
      </Component>
    );
  }

  return (
    <Component
      data-animated=""
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
      variants={tight ? fadeUpTight : fadeUp}
      // The delay rides on `custom`, not `transition` — see fadeUp in lib/motion.ts.
      custom={delay || undefined}
      transition={transition}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </Component>
  );
}

interface AnimatedListProps extends HTMLMotionProps<"div"> {
  as?: Tag;
  stagger?: number;
  delay?: number;
  immediate?: boolean;
}

/** Staggers direct `AnimatedItem` children as the group scrolls into view. */
export function AnimatedList({
  as = "div",
  stagger = 0.05,
  delay = 0,
  immediate = false,
  children,
  ...props
}: AnimatedListProps) {
  const Component = TAGS[as] as typeof motion.div;

  return (
    <Component
      initial="hidden"
      {...(immediate ? { animate: "visible" } : { whileInView: "visible", viewport: revealViewport })}
      variants={staggerContainer(stagger, delay)}
      {...props}
    >
      {children}
    </Component>
  );
}

interface AnimatedItemProps extends HTMLMotionProps<"div"> {
  as?: Tag;
  tight?: boolean;
}

export function AnimatedItem({ as = "div", tight = false, children, ...props }: AnimatedItemProps) {
  const Component = TAGS[as] as typeof motion.div;
  return (
    <Component data-animated="" variants={tight ? fadeUpTight : fadeUp} {...props}>
      {children}
    </Component>
  );
}
