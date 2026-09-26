"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** How long the confirmation holds before reverting to the resting state. */
const COPIED_MS = 1_600;
/** The manual-copy hint needs longer — the user has to act on it. */
const HINT_MS = 3_200;

type Status = "idle" | "copied" | "manual";

/**
 * Copies `code` to the clipboard.
 *
 * The async clipboard API is unavailable on insecure origins and can be denied
 * by permission policy, so there is a legacy `execCommand` fallback; if that
 * fails too the button says how to copy by hand rather than claiming success.
 */
async function writeToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Denied or unavailable — fall through to the legacy path.
  }

  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    // Off-screen but still selectable; `display:none` would break the copy.
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand("copy");
    area.remove();
    return copied;
  } catch {
    return false;
  }
}

function manualShortcut(): string {
  return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent) ? "⌘C" : "Ctrl+C";
}

export interface CopyButtonProps {
  code: string;
  className?: string;
}

/**
 * Copy-to-clipboard control for a code block.
 *
 * Hidden until the block is hovered or something inside it takes focus, and
 * always visible where there is no hover (touch). The label swaps with the
 * icon so the state is never carried by motion alone, and the same change is
 * announced through a polite live region.
 */
export function CopyButton({ code, className }: CopyButtonProps) {
  const [status, setStatus] = React.useState<Status>("idle");
  const [shortcut, setShortcut] = React.useState("Ctrl+C");
  const timer = React.useRef<number | null>(null);

  React.useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    []
  );

  const revertAfter = (ms: number) => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus("idle"), ms);
  };

  const handleClick = async () => {
    const copied = await writeToClipboard(code);
    if (copied) {
      setStatus("copied");
      revertAfter(COPIED_MS);
      return;
    }
    setShortcut(manualShortcut());
    setStatus("manual");
    revertAfter(HINT_MS);
  };

  const label = status === "copied" ? "Copied" : status === "manual" ? `Press ${shortcut}` : "Copy";
  const announcement =
    status === "copied"
      ? "Code copied to clipboard"
      : status === "manual"
        ? `Copying failed. Press ${shortcut} to copy the selected code.`
        : "";

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      // Stable regardless of state, so the accessible name never shifts.
      aria-label="Copy code"
      whileTap={{ y: 1 }}
      transition={transitions.fast}
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-md border border-code-border bg-code-chrome px-1.5",
        "font-mono text-2xs font-medium text-code-foreground/75",
        "transition-[opacity,color,border-color] duration-150 ease-emphasis",
        "hover:border-code-foreground/30 hover:text-code-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-code",
        // Reveal on hover or keyboard focus anywhere in the block; on touch
        // devices (no hover) it stays visible, since there is nothing to hover.
        "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100",
        "[@media(hover:none)]:opacity-100",
        className
      )}
    >
      <span className="relative grid size-3.5 shrink-0 place-items-center" aria-hidden="true">
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            key={status === "copied" ? "done" : "copy"}
            className="absolute inset-0 grid place-items-center"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={transitions.fast}
          >
            {status === "copied" ? (
              <Check className="size-3.5 text-success" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </motion.span>
        </AnimatePresence>
      </span>

      {/* Fixed minimum width so the chrome strip doesn't jump on state change. */}
      <span className="min-w-[2.75rem] text-left" aria-hidden="true">
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            key={label}
            className="inline-block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transitions.fast}
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </span>

      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </motion.button>
  );
}
