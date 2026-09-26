import type { Transition, Variants } from "framer-motion";

/* ===========================================================================
   Animation language
   ---------------------------------------------------------------------------
   Four levels. Every animation in the app picks a level from this file; if
   something wants a duration that isn't here, the interaction is usually wrong
   rather than the token.

     L1  micro       100–180ms   hover, press, icon swap, copy confirmation
     L2  navigation  200–350ms   route/chapter change, drawer, disclosure,
                                 travelling indicators
     L3  entrance    300–500ms   section and page reveals — once, never replayed
     L4  major       400–700ms   a state the reader should notice: completion,
                                 progress moving, a shared element relocating

   Rhythm matters as much as duration: static content → one subtle interaction →
   static content → one meaningful transition. Two animations competing for the
   same glance is the failure mode, not a slow animation.

   Springs are for things that track a position or respond to a hand — travelling
   indicators, drawers, magnetic controls, shared elements. Durations are for
   everything else, because a fade with a spring reads as indecision.
   =========================================================================== */

/** Standard easing — decelerating, no overshoot. */
export const easeOut = [0.22, 0.61, 0.36, 1] as const;
/** Symmetric easing for state that reverses (disclosure, toggles). */
export const easeInOut = [0.4, 0, 0.2, 1] as const;
/** Barely-there anticipation. For L4 only, and never on content that reflows. */
export const easeEmphasis = [0.16, 0.84, 0.28, 1] as const;

export const durations = {
  instant: 0.1,
  /** L1 */
  fast: 0.16,
  /** L2 */
  base: 0.24,
  /** L2, upper end */
  slow: 0.32,
  /** L3 */
  entrance: 0.42,
  /** L4 */
  major: 0.55,
  /** L4 — progress rings/bars, slow enough that a jump in value reads as motion. */
  progress: 0.7,
} as const;

/** The four levels by name, for code that wants to be explicit about intent. */
export const levels = {
  micro: durations.fast,
  navigation: durations.base,
  entrance: durations.entrance,
  major: durations.major,
} as const;

/**
 * Raw spring configs, separate from `transitions` because `useSpring` takes the
 * options bare (no `type`) while a `transition` prop needs `type: "spring"`.
 * Every spring in the app is one of these five — none of them overshoot enough
 * to look playful.
 */
export const springConfigs = {
  /** Pointer-following controls: stiff, with just enough lag to feel physical. */
  magnetic: { stiffness: 260, damping: 22, mass: 0.35 },
  /** Press feedback — reads as a click, not a bounce. */
  press: { stiffness: 700, damping: 40, mass: 0.4 },
  /** Position-tracking indicators (layoutId rails, tab pills, palette selection). */
  indicator: { stiffness: 420, damping: 38, mass: 0.7 },
  /** A shared element relocating between layouts — heavier, deliberate. */
  shared: { stiffness: 260, damping: 30, mass: 0.9 },
  /** Drawers and sheets — a little weight, no bounce. */
  drawer: { stiffness: 340, damping: 34, mass: 0.9 },
  /** Command palette / dialogs. */
  overlay: { stiffness: 380, damping: 30 },
  /** Scroll-linked values: smooths the raw scroll without adding lag you notice. */
  scroll: { stiffness: 220, damping: 34, mass: 0.25 },
} as const;

export const transitions = {
  /** L1 */
  fast: { duration: durations.fast, ease: easeOut },
  micro: { duration: durations.fast, ease: easeOut },
  /** L2 */
  base: { duration: durations.base, ease: easeOut },
  slow: { duration: durations.slow, ease: easeOut },
  /** L3 */
  entrance: { duration: durations.entrance, ease: easeOut },
  /** L4 — a change the reader is meant to register. */
  major: { duration: durations.major, ease: easeEmphasis },

  /* --- Springs (see springConfigs) --------------------------------------- */
  magnetic: { type: "spring", ...springConfigs.magnetic },
  press: { type: "spring", ...springConfigs.press },
  indicator: { type: "spring", ...springConfigs.indicator },
  shared: { type: "spring", ...springConfigs.shared },
  drawer: { type: "spring", ...springConfigs.drawer },
  overlay: { type: "spring", ...springConfigs.overlay },
} satisfies Record<string, Transition>;

/* --- Page / route transitions -------------------------------------------- */

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: transitions.base },
  exit: { opacity: 0, y: -6, transition: transitions.fast },
};

/** @deprecated kept for older call sites — prefer `pageVariants`. */
export const pageTransition = pageVariants;
export const pageTransitionProps = { transition: transitions.base };

/* --- Entrance reveals ---------------------------------------------------- */

export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.base },
};

/**
 * The entrance reveal. `visible` is a function variant so a caller can sequence
 * itself by passing seconds through framer's `custom` prop — a variant-level
 * transition always beats the component's `transition` prop, so a delay has to
 * live inside the variant to take effect.
 *
 * The delay key is omitted when there is no delay: inside a stagger container,
 * framer supplies the per-child delay through that same slot, and an explicit
 * `delay: 0` would cancel the stagger.
 */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (delay?: number) => ({
    opacity: 1,
    y: 0,
    transition: delay ? { ...transitions.entrance, delay } : transitions.entrance,
  }),
};

/** Slightly smaller travel — for items inside an already-revealed container. */
export const fadeUpTight: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: (delay?: number) => ({
    opacity: 1,
    y: 0,
    transition: delay ? { ...transitions.slow, delay } : transitions.slow,
  }),
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.98, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0, transition: transitions.overlay },
  exit: { opacity: 0, scale: 0.98, y: -4, transition: transitions.fast },
};

export const staggerContainer = (stagger = 0.05, delayChildren = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
});

/** Chapter header → metadata → content, in that order. */
export const sequence = (delay: number): Transition => ({
  ...transitions.entrance,
  delay,
});

/** Reveal-on-scroll viewport config: once only, fires just before in view. */
export const revealViewport = { once: true, margin: "-64px 0px -48px 0px" } as const;

/* --- Interaction ---------------------------------------------------------- */

/** Card hover: a 2–3px lift, never a scale. */
export const cardHover = {
  rest: { y: 0 },
  hover: { y: -3, transition: transitions.fast },
  press: { y: -1, transition: { duration: durations.instant } },
} as const;

export const drawerVariants: Variants = {
  hidden: { x: "-100%" },
  visible: { x: 0, transition: transitions.drawer },
  exit: { x: "-100%", transition: { duration: durations.base, ease: easeOut } },
};

export const collapseVariants: Variants = {
  collapsed: { height: 0, opacity: 0, transition: { duration: durations.base, ease: easeInOut } },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: { duration: durations.base, ease: easeInOut },
  },
};

/* --- Shared vocabulary for the polish layer ------------------------------- */

/**
 * Cross-fade one piece of text/icon for another in place (AnimatePresence
 * `mode="wait"`). L1: the swap should be over before the eye settles.
 */
export const swapVariants: Variants = {
  enter: { opacity: 0, y: 4 },
  center: { opacity: 1, y: 0, transition: transitions.fast },
  exit: { opacity: 0, y: -4, transition: { duration: durations.instant, ease: easeOut } },
};

/**
 * Items inside a container that itself just arrived (drawer contents, palette
 * groups, metric tiles). Deliberately smaller travel than a page-level reveal:
 * the container's motion already carried the eye there.
 */
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0, transition: transitions.base },
};

/**
 * Stagger steps, in seconds. Kept short on purpose — a cascade should read as
 * one gesture, so the whole group must finish inside an L3 window. Use
 * `cappedStagger` when the item count is unbounded.
 */
export const stagger = { tight: 0.02, base: 0.04, loose: 0.06 } as const;

/** Stagger that shrinks as the list grows, so N items still land within `total`. */
export function cappedStagger(count: number, step: number = stagger.base, total = 0.3): number {
  if (count <= 1) return 0;
  return Math.min(step, total / count);
}

/**
 * The completion check draws itself: `pathLength` 0 → 1 at L2, so the tick reads
 * as a mark being made rather than an icon appearing. Under reduced motion
 * framer snaps it to 1 and the check is simply there.
 */
export const checkDraw: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { pathLength: { duration: durations.base, ease: easeOut }, opacity: { duration: 0.05 } },
  },
};

/** One-shot ring that expands and fades behind a state change. L4, once, never looped. */
export const pulseVariants: Variants = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: {
    opacity: [0, 0.35, 0],
    scale: [0.7, 1.35, 1.6],
    transition: { duration: durations.major, ease: easeOut },
  },
};
