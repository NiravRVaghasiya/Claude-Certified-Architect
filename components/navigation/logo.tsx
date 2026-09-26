"use client";

import * as React from "react";
import { motion, type Variants } from "framer-motion";
import { transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The mark's one flourish (L1): the accent rule extends to the full width of the
 * page rule above it.
 *
 * `rest` is a designed state, not a resting frame of an animation — at rest the
 * three rules read as a descending stack, which is the logo. The labels are
 * resolved from whichever motion ancestor is being hovered (the header's logo
 * link), so the mark also responds to keyboard focus on the link instead of only
 * to a pointer parked on top of an 18px glyph.
 */
const accentRule: Variants = {
  rest: { scaleX: 1 },
  hover: { scaleX: 1.26, transition: transitions.fast },
};

/**
 * Product mark: a page rule stack with the current line marked in accent —
 * "structured notes, one place you are". Inline SVG so it inherits currentColor
 * and costs no request.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("size-[1.125rem]", className)}
    >
      <rect
        x="3.25"
        y="2.75"
        width="17.5"
        height="18.5"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.6"
        opacity="0.55"
      />
      <path
        d="M7.75 8.5h8.5M7.75 15.5h5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.55"
      />
      <motion.path
        d="M7.75 12h6.75"
        stroke="hsl(var(--accent))"
        strokeWidth="1.6"
        strokeLinecap="round"
        variants={accentRule}
        // originX 0 = the rule's own left end. framer resolves SVG origins
        // against the measured bbox, so the line grows rightward rather than
        // sliding out of the mark.
        style={{ originX: 0 }}
      />
    </svg>
  );
}
