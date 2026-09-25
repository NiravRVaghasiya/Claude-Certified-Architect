"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { fadeUp, revealViewport, staggerContainer } from "@/lib/motion";

interface RevealProps extends HTMLMotionProps<"div"> {
  as?: "div" | "section";
}

/** Fades + rises an element into view once, honoring prefers-reduced-motion. */
export function Reveal({ children, variants, ...props }: RevealProps) {
  const shouldReduceMotion = useReducedMotion();
  if (shouldReduceMotion) {
    return <div className={props.className}>{children as React.ReactNode}</div>;
  }
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
      variants={variants ?? fadeUp}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Wraps a list/grid so children with variants=fadeUp stagger in on view. */
export function RevealGroup({
  children,
  stagger = 0.06,
  ...props
}: HTMLMotionProps<"div"> & { stagger?: number }) {
  const shouldReduceMotion = useReducedMotion();
  if (shouldReduceMotion) {
    return <div className={props.className}>{children as React.ReactNode}</div>;
  }
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
      variants={staggerContainer(stagger)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div variants={fadeUp} {...props}>
      {children}
    </motion.div>
  );
}
