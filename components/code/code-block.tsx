"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CopyButton } from "@/components/code/copy-button";
import { durations, easeOut } from "@/lib/motion";
import { LANGUAGE_LABEL, type Language } from "@/lib/highlight";
import { useMotionSafe } from "@/lib/use-motion";

/* ===========================================================================
   Code block chrome
   ---------------------------------------------------------------------------
   The <pre> itself comes from the chapter HTML (dangerouslySetInnerHTML), so it
   is not part of the React tree. ChapterBody moves it into a host element that
   carries `codeBlockSurface` (or `codeBlockBare`) and portals <CodeBlock/> in
   above it — the chrome strip, language badge and copy button are therefore
   real components, not imperative DOM.
   =========================================================================== */

/**
 * Host classes for a standalone block: dark code surface, hairline border,
 * clipped corners so the <pre>'s own background stops at the radius.
 * `group` drives the copy button's hover reveal.
 */
export const codeBlockSurface =
  "code-block group relative my-6 overflow-hidden rounded-xl border border-code-border bg-code shadow-xs";

/**
 * Host classes for blocks the source already styles — ASCII diagrams inside
 * `.diagram*` containers, or a <pre> with its own inline background. They get
 * the copy affordance and nothing else, so the author's layout survives.
 */
export const codeBlockBare = "code-block group relative";

export interface CodeBlockProps {
  /** Plain text of the block — what the copy button writes. */
  code: string;
  language: Language;
  /** Caption lifted out of the source markup (`.code-label`, `.filename`, …). */
  label?: string | null;
}

export function CodeBlock({ code, language, label }: CodeBlockProps) {
  const motionSafe = useMotionSafe();
  const badge = LANGUAGE_LABEL[language];

  // A counter rather than a boolean: re-keying the overlay is what restarts the
  // acknowledgement when the same block is copied twice.
  const [copies, setCopies] = React.useState(0);

  // With nothing to name, a chrome strip would just be an empty bar — float the
  // button over the code instead. No acknowledgement here either: these are
  // author-drawn diagrams, where an accent hairline would read as part of the art.
  if (!label && !badge) {
    return <CopyButton code={code} className="absolute right-2 top-2 z-10" />;
  }

  return (
    <div className="relative flex items-center gap-3 border-b border-code-border bg-code-chrome px-3 py-1.5">
      {label ? (
        <span className="min-w-0 flex-1 truncate font-mono text-2xs font-medium text-code-foreground/70">
          {label}
        </span>
      ) : (
        <span className="flex-1" />
      )}
      {badge && (
        <span className="shrink-0 font-mono text-2xs font-medium uppercase tracking-label text-code-foreground/70">
          {badge}
        </span>
      )}
      <CopyButton code={code} onCopied={() => setCopies((count) => count + 1)} />

      {/* The block's one L4 beat. The strip's hairline brightens and settles, so
          the acknowledgement belongs to the block the reader copied rather than to
          the button or to a toast — at this length it registers without asking to
          be watched.

          Opacity on a 1px overlay sitting on top of the existing border: nothing
          moves, nothing reflows, and the border itself is never repainted. Gated
          on motion-safe because here the animation *is* the signal; the button's
          "Copied" label and its live region carry the state either way. */}
      {motionSafe && copies > 0 && (
        <motion.span
          key={copies}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-accent"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.9, 0] }}
          transition={{ duration: durations.major, ease: easeOut }}
        />
      )}
    </div>
  );
}
