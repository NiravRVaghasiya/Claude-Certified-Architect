"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Circle } from "lucide-react";
import { AnimatedButton } from "@/components/ui/button";
import { transitions } from "@/lib/motion";
import { useProgress } from "@/lib/progress";

/**
 * Completion toggle. The icon swaps circle → check with a short scale/fade, and
 * the label follows; under reduced motion both simply change state.
 */
export function MarkCompleteButton({ slug, className }: { slug: string; className?: string }) {
  const { hydrated, isComplete, toggleComplete } = useProgress();
  const done = hydrated && isComplete(slug);

  return (
    <AnimatedButton
      type="button"
      variant={done ? "success" : "outline"}
      size="sm"
      onClick={() => toggleComplete(slug)}
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
              <Check className="size-4" aria-hidden="true" />
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
