"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Circle } from "lucide-react";
import { AnimatedCheck } from "@/components/animations/animated-check";
import { AnimatedButton } from "@/components/ui/button";
import { transitions } from "@/lib/motion";
import { useProgress } from "@/lib/progress";

/**
 * Completion toggle — the one L4 moment in the reader.
 *
 * Finishing a chapter is the only thing here worth marking, so completing draws
 * the check's stroke and fires exactly one ring behind it. Everything else about
 * the control stays L1: the circle/check swap and the label are feedback on a
 * click, not an event.
 *
 * Deliberately *not* magnetic. It sits at the end of a dense metadata row, hard
 * against the hairline rule and the article's right edge, and a control that
 * leans toward the cursor there reads as looseness rather than precision. It also
 * would replace the hover lift with the lean — and the drawn check already gives
 * this button more physicality than anything else on the page.
 */
export function MarkCompleteButton({ slug, className }: { slug: string; className?: string }) {
  const { hydrated, isComplete, toggleComplete } = useProgress();
  const done = hydrated && isComplete(slug);

  // `done` also flips false → true on hydration for a chapter that was already
  // complete, and that is not an achievement — it is a fact being restored. Only
  // a click the reader just made earns the draw and the ring, so the celebration
  // is tracked separately from the state.
  const [earned, setEarned] = React.useState(false);

  const handleClick = () => {
    setEarned(!done);
    toggleComplete(slug);
  };

  return (
    <AnimatedButton
      type="button"
      variant={done ? "success" : "outline"}
      size="sm"
      onClick={handleClick}
      aria-pressed={done}
      className={className}
    >
      <span className="relative grid size-4 place-items-center">
        <AnimatePresence initial={false} mode="wait">
          {done ? (
            <motion.span
              key="done"
              className="absolute inset-0 grid place-items-center"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={transitions.fast}
            >
              {/* `instant` for a restored completion: the check is simply already
                  there, which is also the correct reduced-motion state. */}
              <AnimatedCheck size={16} pulse={earned} instant={!earned} />
            </motion.span>
          ) : (
            <motion.span
              key="todo"
              className="absolute inset-0 grid place-items-center"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={transitions.fast}
            >
              <Circle className="size-4" aria-hidden="true" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      {/* Width reserved for the longer label: the text swaps on hydration and on
          every toggle, and this row is flex-wrap. */}
      <span className="min-w-[6.5rem] text-left">{done ? "Completed" : "Mark complete"}</span>
    </AnimatedButton>
  );
}
