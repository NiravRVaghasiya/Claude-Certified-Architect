import * as React from "react";
import { cn } from "@/lib/utils";

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
      <path
        d="M7.75 12h8.5"
        stroke="hsl(var(--accent))"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
