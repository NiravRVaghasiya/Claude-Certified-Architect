"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { CodeBlock, codeBlockBare, codeBlockSurface } from "@/components/code/code-block";
import { detectLanguage, highlight, MAX_HIGHLIGHT_CHARS, type Language } from "@/lib/highlight";
import { cn } from "@/lib/utils";

/* ===========================================================================
   Chapter body
   ---------------------------------------------------------------------------
   Renders the chapter HTML and progressively enhances every <pre> in it:

     1. the block is moved into a host element that carries the code surface,
     2. <CodeBlock/> (chrome strip + language badge + copy button) is portalled
        into a container inside that host, so the chrome is a real component,
     3. plain blocks are tokenized by lib/highlight.ts.

   The pass is idempotent — a second run (React StrictMode, a re-render) sees the
   `data-code-enhanced` marker and leaves the block alone — and it is undone on
   unmount or when `html` changes.
   =========================================================================== */

/** Source-markup classes that caption the block that follows them. */
const LABEL_CLASSES = ["code-label", "filename", "code-heading", "code-caption", "lang-label"];

/** Caption spans the source puts *inside* the <pre>, ahead of the code. */
const INNER_LABEL_CLASSES = ["lang-label", "label"];

/** Author-drawn art: chrome yes, tokenizing never. */
const ART_CLASSES = ["ascii", "ascii-diagram", "mermaid"];

/** Containers whose <pre> children are diagrams the source already styles. */
const ART_CONTAINERS = ".diagram, .diagram-box, .diagram-container, .diagram-wrap, .viz-box, .svgwrap";

/** Wrappers the stylesheets give `overflow-x: auto` — see the a11y pass below. */
const SCROLLABLE_CONTAINERS = [
  ".table-wrap",
  ".table-scroll",
  ".tbl-wrap",
  ".tbl-scroll",
  ".matrix-wrap",
  ".quadrant-wrap",
  ".diagram-container",
  ".diagram-wrap",
  ".svgwrap",
  // Code and ASCII-art blocks scroll horizontally too.
  "pre",
].join(", ");

interface MountedBlock {
  key: string;
  container: HTMLElement;
  code: string;
  language: Language;
  label: string | null;
}

export interface ChapterBodyProps {
  html: string;
  className?: string;
}

export function ChapterBody({ html, className }: ChapterBodyProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [blocks, setBlocks] = React.useState<MountedBlock[]>([]);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const mounted: MountedBlock[] = [];
    const undo: Array<() => void> = [];

    root.querySelectorAll("pre").forEach((pre, index) => {
      // Per-block marker, so a second pass over the same DOM is a no-op.
      if (pre.dataset.codeEnhanced !== undefined) return;

      // Where the code text actually lives, and whether the source already
      // tokenized it (half the chapters ship their own token spans — those must
      // never be re-highlighted).
      const target = pre.querySelector("code") ?? pre;

      // 28 blocks open with their caption *inside* the <pre> (`<span class=
      // "lang-label">yaml</span>`), which would otherwise be copied as the first
      // characters of the code. Lift it into the chrome instead.
      let innerLabel: string | null = null;
      const first = target.firstElementChild;
      if (
        first instanceof HTMLElement &&
        INNER_LABEL_CLASSES.some((name) => first.classList.contains(name)) &&
        (target.firstChild === first || target.firstChild?.textContent?.trim() === "")
      ) {
        const text = first.textContent?.trim() ?? "";
        if (text.length > 0 && text.length < 80) {
          innerLabel = text;
          const anchor = first.nextSibling;
          first.remove();
          undo.push(() => {
            if (target.isConnected) target.insertBefore(first, anchor ?? target.firstChild);
          });
        }
      }

      const code = (target.textContent ?? "").replace(/^\n/, "");
      if (code.trim().length === 0) return;
      const preTokenized = target.querySelector("[class]") !== null;

      // A <pre> with its own background, or one sitting in a diagram container,
      // is part of a composition the source styles itself: leave it looking as
      // it does and only add the copy affordance.
      const bare =
        pre.style.background !== "" ||
        pre.style.backgroundColor !== "" ||
        pre.closest(ART_CONTAINERS) !== null;
      const art = bare || ART_CLASSES.some((name) => pre.classList.contains(name));

      const language = art ? "text" : detectLanguage(code);
      if (!art && !preTokenized && language !== "text" && code.length <= MAX_HIGHLIGHT_CHARS) {
        target.innerHTML = highlight(code, language);
      }

      // Lift an adjacent caption into the chrome strip and hide the original, so
      // the label reads as part of the block instead of being repeated above it.
      let label: string | null = innerLabel;
      if (!bare && label === null) {
        const previous = pre.previousElementSibling;
        if (
          previous instanceof HTMLElement &&
          LABEL_CLASSES.some((name) => previous.classList.contains(name))
        ) {
          const text = previous.textContent?.trim() ?? "";
          if (text.length > 0) {
            label = text;
            const restore = previous.style.display;
            // Inline style, so a class rule can't reveal it again.
            previous.style.display = "none";
            undo.push(() => {
              if (previous.isConnected) previous.style.display = restore;
            });
          }
        }
      }

      // Host for the block: the chrome portal's container first, then the <pre>
      // itself. The host owns the positioning context and the `group` that
      // reveals the copy button, so the styles stay off the author's markup.
      const host = document.createElement("div");
      host.className = bare ? codeBlockBare : codeBlockSurface;
      const container = document.createElement("div");
      container.dataset.codeChrome = "";
      pre.dataset.codeEnhanced = bare ? "bare" : "surface";
      pre.replaceWith(host);
      host.append(container, pre);

      undo.push(() => {
        delete pre.dataset.codeEnhanced;
        // Put the <pre> back where it was; the container leaves with the host,
        // detached but intact, so React can still unmount its portal cleanly.
        if (host.isConnected) host.replaceWith(pre);
      });

      mounted.push({ key: `code-${index}`, container, code, language, label });
    });

    setBlocks(mounted);

    return () => {
      // Unmount the portals first, then restore the DOM we rearranged.
      setBlocks([]);
      for (const step of undo) step();
    };
  }, [html]);

  // Wide tables and diagrams sit in horizontally scrolling wrappers. A mouse can
  // scroll them; a keyboard can't unless the wrapper is focusable, so mark the
  // ones that actually overflow as focusable regions (and unmark them when a
  // resize makes them fit again).
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const SCROLL_REGION_LABEL = (el: HTMLElement) =>
      el.tagName === "PRE"
        ? "Code block, scrollable"
        : el.querySelector("table")
          ? "Table, scrollable"
          : "Diagram, scrollable";

    const sync = () => {
      root.querySelectorAll<HTMLElement>(SCROLLABLE_CONTAINERS).forEach((el) => {
        const overflows = el.scrollWidth - el.clientWidth > 1;
        if (overflows && !el.dataset.scrollRegion) {
          el.dataset.scrollRegion = "";
          el.tabIndex = 0;
          el.setAttribute("role", "region");
          el.setAttribute("aria-label", SCROLL_REGION_LABEL(el));
        } else if (!overflows && el.dataset.scrollRegion !== undefined) {
          delete el.dataset.scrollRegion;
          el.removeAttribute("tabindex");
          el.removeAttribute("role");
          el.removeAttribute("aria-label");
        }
      });
    };

    sync();
    // Catches the font-swap reflow and any container resize.
    const observer = new ResizeObserver(sync);
    observer.observe(root);
    return () => observer.disconnect();
  }, [html]);

  return (
    <>
      <div
        ref={rootRef}
        className={cn("chapter-prose prose max-w-none", className)}
        // Body HTML is sanitized at build time in scripts/ingest.ts (sanitize-html
        // allowlist); never render unsanitized/user-supplied HTML this way.
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {blocks.map((block) =>
        createPortal(
          <CodeBlock code={block.code} language={block.language} label={block.label} />,
          block.container,
          block.key
        )
      )}
    </>
  );
}
