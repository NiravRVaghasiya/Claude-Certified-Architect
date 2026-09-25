"use client";

import * as React from "react";
import Fuse from "fuse.js";
import type { SearchIndexEntry } from "./types";

interface SearchIndex {
  fuse: Fuse<SearchIndexEntry>;
  entries: SearchIndexEntry[];
}

let cache: Promise<SearchIndex> | null = null;

function loadIndex(): Promise<SearchIndex> {
  if (!cache) {
    cache = fetch("/search-index.json")
      .then((res) => res.json() as Promise<SearchIndexEntry[]>)
      .then((entries) => ({
        entries,
        fuse: new Fuse(entries, {
          includeScore: true,
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
      }));
  }
  return cache;
}

/** Lazily loads the search index and returns a ready-to-query Fuse instance. */
export function useSearchIndex() {
  const [index, setIndex] = React.useState<SearchIndex | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const load = React.useCallback(() => {
    if (index || loading) return;
    setLoading(true);
    loadIndex()
      .then(setIndex)
      .catch((e) => setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => setLoading(false));
  }, [index, loading]);

  return {
    fuse: index?.fuse ?? null,
    entries: index?.entries ?? [],
    loading,
    error,
    load,
  };
}
