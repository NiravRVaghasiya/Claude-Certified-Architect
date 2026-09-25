"use client";

import { motion, useReducedMotion } from "framer-motion";
import { pageTransition, pageTransitionProps } from "@/lib/motion";

export default function Template({ children }: { children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) return <>{children}</>;

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={pageTransition}
      transition={pageTransitionProps.transition}
    >
      {children}
    </motion.div>
  );
}
