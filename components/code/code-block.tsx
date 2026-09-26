"use client";

import * as React from "react";
import { CopyButton } from "@/components/code/copy-button";
import { LANGUAGE_LABEL, type Language } from "@/lib/highlight";

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
  const badge = LANGUAGE_LABEL[language];

  // With nothing to name, a chrome strip would just be an empty bar — float the
  // button over the code instead.
  if (!label && !badge) {
    return <CopyButton code={code} className="absolute right-2 top-2 z-10" />;
  }

  return (
    <div className="flex items-center gap-3 border-b border-code-border bg-code-chrome px-3 py-1.5">
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
      <CopyButton code={code} />
    </div>
  );
}
