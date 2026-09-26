"use client";

import * as React from "react";
import Fuse, { type FuseResultMatch } from "fuse.js";
import type { SearchIndexEntry, Track } from "./types";

interface SearchIndex {
  fuse: Fuse<SearchIndexEntry>;
  entries: SearchIndexEntry[];
}

let cache: Promise<SearchIndex> | null = null;

function loadIndex(): Promise<SearchIndex> {
  if (!cache) {
    cache = fetch("/search-index.json")
      .then((res) => {
        // fetch only rejects on network failure, so a 404/500 has to be raised here.
        if (!res.ok) throw new Error(`Search index failed to load (${res.status})`);
        return res.json() as Promise<SearchIndexEntry[]>;
      })
      .then((entries) => ({
        entries,
        fuse: new Fuse(entries, {
          includeScore: true,
          // Match ranges drive the result-row highlighting and section picking.
          includeMatches: true,
          minMatchCharLength: 2,
          threshold: 0.34,
          ignoreLocation: true,
          keys: [
            { name: "title", weight: 0.4 },
            { name: "sections", weight: 0.25 },
            { name: "dek", weight: 0.15 },
            { name: "domain", weight: 0.1 },
            { name: "excerpt", weight: 0.1 },
          ],
        }),
      }))
      .catch((err: unknown) => {
        // Drop the cache so the error state's retry re-fetches instead of
        // replaying the same rejected promise forever.
        cache = null;
        throw err;
      });
  }
  return cache;
}

/**
 * Lazily loads the search index and returns a ready-to-query Fuse instance.
 *
 * `load` and `retry` have stable identities, and the fetch state lives in a ref
 * rather than in the callback's deps. Callers fire `load` from an effect keyed on
 * it, so a changing identity would re-run that effect on every state flip — and
 * since a failed load clears the module cache, each of those re-runs would be a
 * fresh request. A failure now settles on the error state until the user retries.
 */
export function useSearchIndex() {
  const [index, setIndex] = React.useState<SearchIndex | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const status = React.useRef<"idle" | "loading" | "loaded" | "error">("idle");

  const start = React.useCallback(() => {
    status.current = "loading";
    setLoading(true);
    setError(null);
    loadIndex()
      .then((next) => {
        status.current = "loaded";
        setIndex(next);
      })
      .catch((e: unknown) => {
        status.current = "error";
        setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => setLoading(false));
  }, []);

  /** Fetch once. A no-op once the index is loading, loaded, or has failed. */
  const load = React.useCallback(() => {
    if (status.current === "idle") start();
  }, [start]);

  /** Explicit user-driven retry — the only way out of the error state. */
  const retry = React.useCallback(() => {
    if (status.current !== "loading") start();
  }, [start]);

  return {
    fuse: index?.fuse ?? null,
    entries: index?.entries ?? [],
    loading,
    error,
    load,
    retry,
  };
}

/* --- Query helpers -------------------------------------------------------- */

/** Result cap for the command palette (enough to scroll, few enough to scan). */
export const PALETTE_LIMIT = 20;
/** Result cap for the full search page. */
export const PAGE_LIMIT = 60;

export interface SearchHit {
  entry: SearchIndexEntry;
  /** Fuse match ranges — which key matched where. Empty for unfiltered lists. */
  matches: readonly FuseResultMatch[];
  /** Fuse score, 0 = perfect. */
  score: number;
}

/** Runs a query and normalises Fuse's result shape into `SearchHit`s. */
export function searchEntries(
  fuse: Fuse<SearchIndexEntry> | null,
  query: string,
  limit = PALETTE_LIMIT
): SearchHit[] {
  const trimmed = query.trim();
  if (!fuse || !trimmed) return [];
  return fuse.search(trimmed, { limit }).map((result) => ({
    entry: result.item,
    matches: result.matches ?? [],
    score: result.score ?? 0,
  }));
}

/** Wraps plain entries as hits so unqueried lists render through the same row. */
export function toHits(entries: readonly SearchIndexEntry[]): SearchHit[] {
  return entries.map((entry) => ({ entry, matches: [], score: 0 }));
}

/** Reading order — the order tracks appear in the guide and in every results list. */
export const TRACK_ORDER: readonly Track[] = ["core", "foundation", "professional"];

export interface TrackHitGroup {
  track: Track;
  hits: SearchHit[];
}

/**
 * Buckets hits by track in reading order, preserving relevance order within a
 * bucket. Empty tracks are dropped so no headings hang over nothing.
 */
export function groupHitsByTrack(hits: readonly SearchHit[]): TrackHitGroup[] {
  return TRACK_ORDER.map((track) => ({
    track,
    hits: hits.filter((hit) => hit.entry.track === track),
  })).filter((group) => group.hits.length > 0);
}
