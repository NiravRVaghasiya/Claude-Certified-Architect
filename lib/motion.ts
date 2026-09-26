import type { Transition, Variants } from "framer-motion";

/* ===========================================================================
   Animation language
   ---------------------------------------------------------------------------
   Four speeds, two easings, two springs. Every animation in the app picks from
   this file — if something needs a duration that isn't here, the interaction is
   probably wrong rather than the token.

     fast      100–180ms   hover, press, icon swap, copy confirmation
     normal    200–350ms   page/chapter transition, drawer, disclosure
     entrance  300–500ms   first-paint reveals (once, never on scroll-back)

   Springs are reserved for things that track a position: the sidebar's active
   indicator, the mobile drawer, the command palette.
   =========================================================================== */

/** Standard easing — decelerating, no overshoot. */
export const easeOut = [0.22, 0.61, 0.36, 1] as const;
/** Symmetric easing for state that reverses (disclosure, toggles). */
export const easeInOut = [0.4, 0, 0.2, 1] as const;

export const durations = {
  instant: 0.1,
  fast: 0.16,
  base: 0.24,
  slow: 0.32,
  entrance: 0.42,
  /** Progress rings/bars: slower on purpose, so a jump in value reads as motion. */
  progress: 0.7,
} as const;

export const transitions = {
  fast: { duration: durations.fast, ease: easeOut },
  base: { duration: durations.base, ease: easeOut },
  slow: { duration: durations.slow, ease: easeOut },
  entrance: { duration: durations.entrance, ease: easeOut },
  /** Position-tracking indicator (layoutId rails, tab underlines). */
  indicator: { type: "spring", stiffness: 420, damping: 38, mass: 0.7 },
  /** Drawers and sheets — a little weight, no bounce. */
  drawer: { type: "spring", stiffness: 340, damping: 34, mass: 0.9 },
  /** Command palette / dialogs. */
  overlay: { type: "spring", stiffness: 380, damping: 30 },
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
