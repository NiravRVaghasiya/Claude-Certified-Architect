"use client";

import * as React from "react";
import Link from "next/link";
import { motion, type HTMLMotionProps } from "framer-motion";
import { transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** The one card surface recipe: hairline border, card fill, near-invisible depth. */
export const cardSurface =
  "rounded-xl border border-border bg-card shadow-xs transition-[border-color,box-shadow,background-color] duration-200 ease-emphasis";

/** Added on hover/focus for interactive cards — border first, depth second. */
export const cardInteractive =
  "hover:border-border-strong hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(cardSurface, className)} {...props} />;
}

/**
 * Hover-lift card. The movement is deliberately tiny (3px) and carried by
 * transform only; border and shadow do the rest via CSS transitions.
 */
export function AnimatedCard({ className, children, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      className={cn(cardSurface, cardInteractive, className)}
      whileHover={{ y: -3 }}
      whileTap={{ y: -1 }}
      transition={transitions.fast}
      {...props}
    >
      {children}
    </motion.div>
  );
}

const MotionLink = motion.create(Link);

interface CardLinkProps extends Omit<HTMLMotionProps<"a">, "href"> {
  href: string;
  children: React.ReactNode;
  /** Set false for cards that shouldn't lift (e.g. dense list rows). */
  lift?: boolean;
}

/**
 * A whole card that is one link — keeps a single focusable element (and one
 * focus ring) rather than nesting a link inside an animated wrapper.
 */
export function CardLink({ href, className, children, lift = true, ...props }: CardLinkProps) {
  return (
    <MotionLink
      href={href}
      className={cn(cardSurface, cardInteractive, "block", className)}
      whileHover={lift ? { y: -3 } : undefined}
      whileTap={lift ? { y: -1 } : undefined}
      transition={transitions.fast}
      {...props}
    >
      {children}
    </MotionLink>
  );
}
