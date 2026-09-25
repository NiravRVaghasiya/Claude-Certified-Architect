"use client";

import * as React from "react";

/**
 * Renders pre-sanitized chapter HTML and progressively enhances every
 * <pre> code block with a copy-to-clipboard button. The button is created
 * imperatively (not via React) since the block's contents come from
 * dangerouslySetInnerHTML and aren't part of the React tree.
 */
export function ChapterBody({ html }: { html: string }) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const blocks = Array.from(root.querySelectorAll("pre"));
    const cleanups: Array<() => void> = [];

    for (const pre of blocks) {
      if (pre.parentElement?.classList.contains("code-block")) continue;

      const wrapper = document.createElement("div");
      wrapper.className = "code-block relative";
      pre.replaceWith(wrapper);
      wrapper.appendChild(pre);

      const button = document.createElement("button");
      button.type = "button";
      button.className =
        "absolute right-2 top-2 rounded-md border border-white/10 bg-white/10 px-2 py-1 text-xs font-medium text-slate-200 opacity-0 transition-opacity hover:bg-white/20 focus-visible:opacity-100 group-hover:opacity-100";
      button.textContent = "Copy";
      wrapper.classList.add("group");

      const onClick = () => {
        const text = pre.textContent ?? "";
        navigator.clipboard
          .writeText(text)
          .then(() => {
            button.textContent = "Copied!";
            setTimeout(() => (button.textContent = "Copy"), 1500);
          })
          .catch(() => {
            button.textContent = "Failed";
            setTimeout(() => (button.textContent = "Copy"), 1500);
          });
      };
      button.addEventListener("click", onClick);
      cleanups.push(() => button.removeEventListener("click", onClick));

      wrapper.appendChild(button);
    }

    return () => cleanups.forEach((fn) => fn());
  }, [html]);

  return (
    <div
      ref={ref}
      className="chapter-prose prose prose-slate max-w-none dark:prose-invert"
      // Body HTML is sanitized at build time in scripts/ingest.ts (sanitize-html
      // allowlist); never render unsanitized/user-supplied HTML this way.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
