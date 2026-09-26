import type { FuseResultMatch, RangeTuple } from "fuse.js";

/* ===========================================================================
   Query-term highlighting
   ---------------------------------------------------------------------------
   Everything here works on character ranges and returns plain strings, so the
   result rows can render highlights as real React elements. Nothing in the
   search surfaces ever touches `dangerouslySetInnerHTML` — index content is
   author-controlled today, but a highlighter is exactly the place where that
   assumption quietly stops being true.
   =========================================================================== */

export interface HighlightSegment {
  text: string;
  /** True when this run matched the query and should be visually marked. */
  match: boolean;
}

/** Fuzzy matching yields a lot of 1-character noise; only longer runs are shown. */
const MIN_FUZZY_RUN = 2;

/**
 * Distinct search terms, longest first so that on an overlap ("context" vs
 * "con") the widest run is the one that survives the merge.
 */
export function queryTerms(query: string): string[] {
  const terms = query
    .toLowerCase()
    // ASCII-only split keeps the regex ES2017-compatible (no \p{L} escapes).
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 0);
  return Array.from(new Set(terms)).sort((a, b) => b.length - a.length);
}

/** Sorts, clamps and unions overlapping/adjacent inclusive ranges. */
export function mergeRanges(ranges: readonly RangeTuple[]): RangeTuple[] {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged: RangeTuple[] = [];
  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1] + 1) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged;
}

/** Every literal occurrence of any query term inside `text`, case-insensitive. */
export function queryRanges(text: string, query: string): RangeTuple[] {
  const haystack = text.toLowerCase();
  const ranges: RangeTuple[] = [];
  for (const term of queryTerms(query)) {
    let from = 0;
    for (;;) {
      const at = haystack.indexOf(term, from);
      if (at === -1) break;
      ranges.push([at, at + term.length - 1]);
      from = at + term.length;
    }
  }
  return mergeRanges(ranges);
}

/** Splits `text` at `ranges`, alternating unmatched and matched segments. */
export function toSegments(text: string, ranges: readonly RangeTuple[]): HighlightSegment[] {
  if (ranges.length === 0) return text ? [{ text, match: false }] : [];

  const segments: HighlightSegment[] = [];
  let cursor = 0;
  for (const [start, end] of ranges) {
    const from = Math.max(cursor, Math.min(start, text.length));
    const to = Math.max(from, Math.min(end + 1, text.length));
    if (from > cursor) segments.push({ text: text.slice(cursor, from), match: false });
    if (to > from) segments.push({ text: text.slice(from, to), match: true });
    cursor = to;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), match: false });
  return segments;
}

/**
 * Highlight segments for one displayed string.
 *
 * Literal term hits win, because they are what the user believes they typed.
 * Fuse's own indices are the fallback, so a typo'd/fuzzy match still shows
 * *where* it matched instead of a row with no visible reason to exist.
 */
export function segmentsFor(
  text: string,
  query: string,
  indices?: readonly RangeTuple[]
): HighlightSegment[] {
  if (!text) return [];
  const literal = query.trim() ? queryRanges(text, query) : [];
  if (literal.length > 0) return toSegments(text, literal);
  const fuzzy = (indices ?? []).filter(([start, end]) => end - start + 1 >= MIN_FUZZY_RUN);
  return toSegments(text, mergeRanges(fuzzy));
}

export interface SectionMatch {
  text: string;
  indices: readonly RangeTuple[];
}

/**
 * The section heading that best explains a hit, so a result can point at a
 * place *inside* a 6,000-word chapter rather than just at the chapter.
 *
 * "Best" = the `sections` match with the most matched characters; falls back to
 * the first heading containing a literal term when the hit was in the title or
 * body instead.
 */
export function bestSectionMatch(
  sections: readonly string[],
  matches: readonly FuseResultMatch[],
  query: string
): SectionMatch | null {
  let best: { match: SectionMatch; weight: number } | null = null;

  for (const match of matches) {
    if (match.key !== "sections") continue;
    const text =
      match.value ?? (match.refIndex === undefined ? undefined : sections[match.refIndex]);
    if (!text) continue;
    const weight = match.indices.reduce((sum, [start, end]) => sum + (end - start + 1), 0);
    if (!best || weight > best.weight) best = { match: { text, indices: match.indices }, weight };
  }
  if (best) return best.match;

  const terms = queryTerms(query);
  if (terms.length === 0) return null;
  for (const section of sections) {
    const lower = section.toLowerCase();
    if (terms.some((term) => lower.includes(term))) return { text: section, indices: [] };
  }
  return null;
}

/**
 * A window of `text` centred on the first query term, trimmed to word
 * boundaries and elided with "…" on the sides that were cut.
 */
export function snippetAround(text: string, query: string, radius = 78): string {
  return snippetWindow(text, query, radius).text;
}

export interface Snippet {
  text: string;
  /**
   * Subtract from an index into the *source* string to map it into `text`.
   * Fuse's ranges address the whole excerpt, so highlighting the window without
   * this correction marks unrelated characters.
   */
  offset: number;
}

/** `snippetAround`, plus the offset needed to re-base match ranges onto it. */
export function snippetWindow(text: string, query: string, radius = 78): Snippet {
  if (!text) return { text: "", offset: 0 };
  const width = radius * 2;
  if (text.length <= width) return { text, offset: 0 };

  const ranges = queryRanges(text, query);
  const center = ranges.length > 0 ? ranges[0][0] : 0;

  let start = Math.max(0, Math.min(center - radius, text.length - width));
  if (start > 0) {
    // Snap forward to the next word start so the window never opens mid-word.
    const space = text.indexOf(" ", start);
    if (space !== -1 && space - start < 20) start = space + 1;
  }

  let end = Math.min(text.length, start + width);
  if (end < text.length) {
    const space = text.lastIndexOf(" ", end);
    if (space > start + radius) end = space;
  }

  // Not trimmed: HTML collapses the edge whitespace anyway, and trimming would
  // shift every index by an amount the caller cannot know.
  const prefix = start > 0 ? "… " : "";
  const suffix = end < text.length ? " …" : "";
  return { text: `${prefix}${text.slice(start, end)}${suffix}`, offset: start - prefix.length };
}

/** Re-bases inclusive source ranges onto a snippet, dropping those outside it. */
export function rebaseRanges(
  ranges: readonly RangeTuple[],
  snippet: Snippet
): RangeTuple[] {
  const limit = snippet.text.length - 1;
  const moved: RangeTuple[] = [];
  for (const [start, end] of ranges) {
    const from = start - snippet.offset;
    const to = end - snippet.offset;
    if (to < 0 || from > limit) continue;
    moved.push([Math.max(0, from), Math.min(limit, to)]);
  }
  return mergeRanges(moved);
}
