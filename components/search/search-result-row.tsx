"use client";

import * as React from "react";
import type { FuseResultMatch } from "fuse.js";
import { Check, CornerDownLeft, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  bestSectionMatch,
  rebaseRanges,
  segmentsFor,
  snippetWindow,
  type HighlightSegment,
} from "./highlight";
import { chapterDek } from "@/lib/dek";
import { TRACK_SHORT } from "@/lib/nav";
import { useProgress } from "@/lib/progress";
import type { SearchIndexEntry, Track } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Padding/geometry shared by the palette's `Command.Item` and the search page's
 * `Link`, so the two surfaces can never drift apart. Interaction styling stays
 * with the wrapper, since selection (palette) and hover/focus (page) are
 * different mechanics.
 */
export const searchRowShell = [
  "block w-full rounded-lg px-3 py-2.5 text-left",
  // 48px minimum on touch; the desktop row is allowed to be denser.
  "min-h-12 sm:min-h-0",
  "transition-colors duration-150 ease-emphasis",
].join(" ");

/**
 * Group name the wrapper must carry. Lets the row's trailing affordance react
 * to cmdk's `data-selected` on the palette item *and* to hover/focus on the
 * search page's link, from one set of classes.
 */
export const SEARCH_ROW_GROUP = "group/srow";

const TRACK_BADGE: Record<Track, "neutral" | "foundation" | "professional"> = {
  core: "neutral",
  foundation: "foundation",
  professional: "professional",
};

/** Renders highlight segments. Matches get a soft accent wash, never a <mark>. */
export function Highlight({
  segments,
  inherit = false,
}: {
  segments: HighlightSegment[];
  /**
   * Let matches take their colour from the surrounding text instead of forcing
   * `foreground`. Needed in the title, which recolours on hover — a match that
   * kept its own colour there would end up *less* prominent than its context.
   */
  inherit?: boolean;
}) {
  return (
    <>
      {segments.map((segment, i) =>
        segment.match ? (
          <span
            key={i}
            className={cn(
              "rounded-[3px] bg-accent/20 px-0.5",
              inherit ? "text-inherit" : "text-foreground"
            )}
          >
            {segment.text}
          </span>
        ) : (
          <React.Fragment key={i}>{segment.text}</React.Fragment>
        )
      )}
    </>
  );
}

/* Varying widths so the placeholder reads as text, not as a table. */
const SKELETON_WIDTHS = ["62%", "48%", "71%", "55%", "44%"];

/**
 * The one looping animation in the app: a skeleton has to say "still coming",
 * and only motion says that. Reduced motion collapses the keyframe to a single
 * 0.01ms iteration (see globals.css) and, with no fill mode, the sweep parks
 * back off-canvas — leaving a plain static bar, which is the correct resting
 * state. Deliberately not branched on `useMotionSafe()`: this renders in
 * server-prerendered markup, and a tree that differs by motion preference
 * mismatches on hydration.
 */
function Shimmer() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-foreground/[0.07] to-transparent"
    />
  );
}

/**
 * Loading placeholder matched to `searchRowShell`'s geometry, so the list does
 * not resize when real results replace it.
 */
export function SearchSkeletonRows({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      {SKELETON_WIDTHS.slice(0, count).map((width, i) => (
        <div key={i} className={cn(searchRowShell, "pointer-events-none")}>
          <span className="flex w-full items-start gap-3">
            <span className="relative size-7 shrink-0 overflow-hidden rounded-md bg-muted">
              <Shimmer />
            </span>
            <span className="min-w-0 flex-1 space-y-2 pt-1">
              <span className="relative block h-3 overflow-hidden rounded-xs bg-muted" style={{ width }}>
                <Shimmer />
              </span>
              <span className="relative block h-2 w-1/4 overflow-hidden rounded-xs bg-muted-subtle">
                <Shimmer />
              </span>
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

export interface SearchResultRowProps {
  entry: SearchIndexEntry;
  /** The raw query, used for literal-term highlighting and the snippet window. */
  query: string;
  /** Fuse match ranges for this hit; empty for unfiltered/idle lists. */
  matches?: readonly FuseResultMatch[];
  /**
   * `palette` stays dense and shows the ↵ affordance; `page` shows the chapter
   * dek when there is no query so an unfiltered list still reads as content.
   */
  variant?: "palette" | "page";
  className?: string;
}

/**
 * The inner content of one search result. Deliberately not interactive itself —
 * the wrapper owns the single focusable element (and the single focus ring).
 */
export function SearchResultRow({
  entry,
  query,
  matches = [],
  variant = "palette",
  className,
}: SearchResultRowProps) {
  const { hydrated, isComplete } = useProgress();
  const complete = hydrated && isComplete(entry.slug);
  const trimmed = query.trim();

  const titleMatch = matches.find((m) => m.key === "title");
  const titleSegments = segmentsFor(entry.title, query, titleMatch?.indices);

  const section = React.useMemo(
    () => (trimmed ? bestSectionMatch(entry.sections, matches, query) : null),
    [trimmed, entry.sections, matches, query]
  );

  // With a query, show the matched slice of the chapter body; without one, the
  // dek is the honest summary (and only on the page, where there is room).
  const snippet = trimmed ? snippetWindow(entry.excerpt, query) : null;
  const context = snippet ? snippet.text : variant === "page" ? chapterDek(entry.dek) ?? "" : "";
  // Only the excerpt's own ranges apply here, and only after re-basing onto the
  // window — a `dek` match's indices address a different string entirely.
  const excerptMatch = snippet ? matches.find((m) => m.key === "excerpt") : undefined;
  const contextSegments = segmentsFor(
    context,
    query,
    excerptMatch && snippet ? rebaseRanges(excerptMatch.indices, snippet) : undefined
  );

  return (
    <span className={cn("flex w-full min-w-0 items-start gap-3", className)}>
      {/* Hover, keyboard focus and cmdk selection all get the same treatment, and
          all three are spelled out: an affordance only a mouse can reach is not
          one. All of it is CSS on data-attributes — the palette would otherwise
          have to re-render every row on every arrow key to move one border. */}
      <span
        aria-hidden="true"
        className="mt-px flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted-subtle font-mono text-2xs tabular text-muted-foreground transition-colors duration-150 group-hover/srow:border-border-strong group-hover/srow:text-foreground group-focus-visible/srow:border-border-strong group-focus-visible/srow:text-foreground group-data-[selected=true]/srow:border-border-strong group-data-[selected=true]/srow:text-foreground"
      >
        {entry.chapterNumber}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="min-w-0 truncate text-[0.8125rem] font-medium text-foreground transition-colors duration-150 group-hover/srow:text-accent group-focus-visible/srow:text-accent group-data-[selected=true]/srow:text-accent sm:text-sm">
            <span className="sr-only">{`Chapter ${entry.chapterNumber}: `}</span>
            <Highlight segments={titleSegments} inherit />
          </span>
          <Badge variant={TRACK_BADGE[entry.track]} size="sm" mono>
            {TRACK_SHORT[entry.track]}
          </Badge>
          {complete && <span className="sr-only">Complete</span>}
        </span>

        <span className="eyebrow mt-1 block truncate">{entry.domain}</span>

        {section && (
          <span className="mt-1.5 flex min-w-0 items-start gap-1.5 text-xs text-muted-foreground">
            <Hash className="mt-[0.1875rem] size-3 shrink-0 text-accent" aria-hidden="true" />
            <span className="min-w-0 truncate">
              <Highlight segments={segmentsFor(section.text, query, section.indices)} />
            </span>
          </span>
        )}

        {context && (
          <span className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            <Highlight segments={contextSegments} />
          </span>
        )}
      </span>

      {/* Both slots keep their width at all times — nothing reflows on select. */}
      <span className="flex shrink-0 items-center gap-1 self-center">
        <span className="flex size-4 items-center justify-center">
          {complete && <Check className="size-3.5 text-success" aria-hidden="true" />}
        </span>
        {variant === "palette" && (
          // Slides the last 4px in rather than fading: arriving from the edge
          // points back at the key you press, and a pure fade on a 14px glyph
          // reads as a rendering artefact (L1).
          <span
            aria-hidden="true"
            className="hidden size-4 translate-x-1 items-center justify-center text-muted-foreground opacity-0 transition-[opacity,transform] duration-150 ease-emphasis group-hover/srow:translate-x-0 group-hover/srow:opacity-100 group-focus-visible/srow:translate-x-0 group-focus-visible/srow:opacity-100 group-data-[selected=true]/srow:translate-x-0 group-data-[selected=true]/srow:opacity-100 sm:flex"
          >
            <CornerDownLeft className="size-3.5" />
          </span>
        )}
      </span>
    </span>
  );
}
