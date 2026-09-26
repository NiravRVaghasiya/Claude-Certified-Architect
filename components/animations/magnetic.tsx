"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, type HTMLMotionProps } from "framer-motion";
import { springConfigs } from "@/lib/motion";
import { useMotionSafe } from "@/lib/use-motion";

/**
 * Magnetic pointer response.
 *
 * A control leans a couple of pixels toward the cursor and springs back when it
 * leaves. The whole point is restraint: the offset is capped at `strength` px
 * (3 by default) so it registers as weight and precision rather than as a
 * moving target — a control that runs away from the pointer is a worse control.
 *
 * Disabled entirely for coarse pointers (there is no cursor to lean toward, and
 * the transform would fight the tap) and under `prefers-reduced-motion`.
 */

/** True only where the primary pointer is precise — mouse/trackpad, not touch. */
function useFinePointer(): boolean {
  const [fine, setFine] = React.useState(false);

  React.useEffect(() => {
    const query = window.matchMedia("(pointer: fine)");
    setFine(query.matches);
    const onChange = (event: MediaQueryListEvent) => setFine(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return fine;
}

export interface MagneticState {
  enabled: boolean;
  /** Spread onto a `motion.*` element's `style`. */
  style: { x: ReturnType<typeof useSpring>; y: ReturnType<typeof useSpring> } | undefined;
  /** Spread onto the same element. */
  handlers: {
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => void;
    onPointerLeave: () => void;
  };
}

export function useMagnetic(strength = 3): MagneticState {
  const motionSafe = useMotionSafe();
  const finePointer = useFinePointer();
  const enabled = motionSafe && finePointer;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  // Springs, not the raw values: the lag is what makes it feel magnetic.
  const springX = useSpring(x, springConfigs.magnetic);
  const springY = useSpring(y, springConfigs.magnetic);

  const onPointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!enabled) return;
      const rect = event.currentTarget.getBoundingClientRect();
      // Offset from centre, normalised to -1…1, then scaled — so the pull is
      // proportional to where in the control the pointer is, not to its size.
      const dx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const dy = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      x.set(Math.max(-1, Math.min(1, dx)) * strength);
      y.set(Math.max(-1, Math.min(1, dy)) * strength);
    },
    [enabled, strength, x, y]
  );

  const onPointerLeave = React.useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return {
    enabled,
    style: enabled ? { x: springX, y: springY } : undefined,
    handlers: { onPointerMove, onPointerLeave },
  };
}

interface MagneticProps extends HTMLMotionProps<"span"> {
  /** Maximum pull in px. Keep it at 2–4; more than that reads as a toy. */
  strength?: number;
  children: React.ReactNode;
}

/**
 * Wrapper that applies the magnetic pull to whatever it contains — a Button, a
 * `Button asChild` link, an icon. Wrapping rather than extending keeps the child's
 * own semantics, focus ring and `asChild` behaviour untouched.
 */
export function Magnetic({ strength = 3, children, style, ...props }: MagneticProps) {
  const magnetic = useMagnetic(strength);

  return (
    <motion.span
      className="inline-flex"
      // Safety net: framer gives any element carrying a tap/hover gesture
      // `tabIndex=0`, which would turn this decorative wrapper into a nameless
      // tab stop. Overridable via props if a caller ever needs it focusable.
      tabIndex={-1}
      {...magnetic.handlers}
      style={{ ...magnetic.style, ...(style as React.CSSProperties) }}
      {...props}
    >
      {children}
    </motion.span>
  );
}
