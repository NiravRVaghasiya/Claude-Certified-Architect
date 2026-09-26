"use client";

import * as React from "react";
import Link from "next/link";
import { Search as SearchIcon, TriangleAlert, X } from "lucide-react";
import { AnimatedSection } from "@/components/animations/animated-section";
import { shortcutLabel, useModifierLabel } from "@/components/search/search-command";
import {
  SEARCH_ROW_GROUP,
  SearchResultRow,
  SearchSkeletonRows,
  searchRowShell,
} from "@/components/search/search-result-row";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Kbd } from "@/components/ui/kbd";
import { transitions } from "@/lib/motion";
import {
  PAGE_LIMIT,
  TRACK_ORDER,
  groupHitsByTrack,
  searchEntries,
  toHits,
  useSearchIndex,
} from "@/lib/search";
import { TRACK_LABELS, type Track } from "@/lib/types";
import { cn } from "@/lib/utils";

function chipClass(active: boolean): string {
  return cn(
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
    "transition-colors duration-150 ease-emphasis",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    active
      ? "border-accent/30 bg-accent/10 text-accent"
      : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground"
  );
}

/**
 * Full search page — the linkable, scrollable counterpart to the ⌘K palette.
 * Both render the same `SearchResultRow`, so relevance and presentation can't
 * diverge between the two surfaces.
 */
export default function SearchPage() {
  const [query, setQuery] = React.useState("");
  const [tracks, setTracks] = React.useState<Track[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const modifier = useModifierLabel();
  const { fuse, entries, loading, error, load, retry } = useSearchIndex();

  React.useEffect(() => {
    load();
  }, [load]);

  const trimmed = query.trim();

  // No query still lists everything, which is how this page doubles as an index.
  const hits = React.useMemo(
    () => (trimmed ? searchEntries(fuse, query, PAGE_LIMIT) : toHits(entries)),
    [fuse, entries, query, trimmed]
  );

  const counts = React.useMemo(() => {
    const totals: Record<Track, number> = { core: 0, foundation: 0, professional: 0 };
    for (const hit of hits) totals[hit.entry.track] += 1;
    return totals;
  }, [hits]);

  const filtered = React.useMemo(
    () => (tracks.length === 0 ? hits : hits.filter((hit) => tracks.includes(hit.entry.track))),
    [hits, tracks]
  );
  const groups = React.useMemo(() => groupHitsByTrack(filtered), [filtered]);

  const toggleTrack = (track: Track) =>
    setTracks((current) =>
      current.includes(track) ? current.filter((t) => t !== track) : [...current, track]
    );

  const clearQuery = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const countLabel = error
    ? "Search is unavailable"
    : loading && entries.length === 0
      ? "Loading the search index…"
      : `${filtered.length} ${filtered.length === 1 ? "chapter" : "chapters"}${
          trimmed ? ` matching “${trimmed}”` : ""
        }`;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-10">
      <AnimatedSection immediate>
        <p className="eyebrow">Search</p>
        <h1 className="mt-2 text-fluid-2xl font-semibold tracking-display">Search the guide</h1>
        <p className="mt-3 max-w-prose text-fluid-base text-muted-foreground">
          Every chapter, section heading, and summary across both certification tracks — matched as
          you type.
        </p>
      </AnimatedSection>

      {/* Header, then controls — the one sequenced reveal on this page. Results
          themselves never animate: search should feel instant, and 70 rows of
          entrance motion on every filter change would not. */}
      <AnimatedSection immediate tight delay={0.06} transition={transitions.slow} className="mt-8">
        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 shadow-xs focus-within:border-border-strong focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            ref={inputRef}
            autoFocus
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search chapters, sections, topics…"
            aria-label="Search chapters"
            className="h-12 w-full bg-transparent text-fluid-base outline-none ring-offset-0 placeholder:text-muted-foreground focus-visible:outline-none sm:text-sm [&::-webkit-search-cancel-button]:hidden"
          />
          {query.length > 0 && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Clear query"
              className="-mr-1.5 shrink-0 text-muted-foreground"
              onClick={clearQuery}
            >
              <X aria-hidden="true" />
            </Button>
          )}
        </div>

        <p className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Kbd className="min-w-[3rem]">{shortcutLabel(modifier)}</Kbd>
          opens the command palette from anywhere in the guide.
        </p>

        {/* Track filters. Empty selection means "all", so the default needs no chip. */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="eyebrow mr-1">Tracks</span>
          <button
            type="button"
            aria-pressed={tracks.length === 0}
            onClick={() => setTracks([])}
            className={chipClass(tracks.length === 0)}
          >
            All
            <span className="font-mono tabular text-[0.6875rem]">{hits.length}</span>
          </button>
          {TRACK_ORDER.map((track) => (
            <button
              key={track}
              type="button"
              aria-pressed={tracks.includes(track)}
              onClick={() => toggleTrack(track)}
              className={chipClass(tracks.includes(track))}
            >
              {TRACK_LABELS[track]}
              <span className="font-mono tabular text-[0.6875rem]">{counts[track]}</span>
            </button>
          ))}
        </div>

        <p
          aria-live="polite"
          className="eyebrow mt-5 min-h-4 border-t border-border pt-4 text-muted-foreground"
        >
          {countLabel}
        </p>
      </AnimatedSection>

      {error ? (
        <Card className="mt-6 flex flex-col items-center gap-3 px-6 py-14 text-center">
          <TriangleAlert className="size-5 text-warning" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            The search index didn&apos;t load, so results are unavailable.
          </p>
          <Button variant="outline" size="sm" onClick={retry}>
            Try again
          </Button>
        </Card>
      ) : loading && entries.length === 0 ? (
        <Card className="mt-6 overflow-hidden p-2">
          <SearchSkeletonRows count={5} />
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="mt-6 flex flex-col items-center gap-3 px-6 py-14 text-center">
          <p className="text-sm font-medium">No chapters match</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {trimmed ? (
              <>
                Nothing matches <span className="text-foreground">“{trimmed}”</span>
                {tracks.length > 0 ? " in the selected tracks" : ""}. Try a shorter or more general
                term.
              </>
            ) : (
              "No chapters in the selected tracks."
            )}
          </p>
          <span className="flex flex-wrap items-center justify-center gap-2">
            {trimmed && (
              <Button variant="outline" size="sm" onClick={clearQuery}>
                Clear query
              </Button>
            )}
            {tracks.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setTracks([])}>
                Show all tracks
              </Button>
            )}
          </span>
        </Card>
      ) : (
        <div className="mt-6 space-y-8">
          {groups.map((group) => (
            <section key={group.track} aria-labelledby={`search-track-${group.track}`}>
              <h2
                id={`search-track-${group.track}`}
                className="eyebrow sticky top-header z-10 -mx-2 mb-2 flex items-center gap-2 bg-background px-2 py-2"
              >
                {TRACK_LABELS[group.track]}
                <span className="tabular text-muted-foreground">{group.hits.length}</span>
              </h2>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                {group.hits.map((hit) => (
                  <li key={hit.entry.slug}>
                    <Link
                      href={`/chapters/${hit.entry.slug}`}
                      className={cn(
                        searchRowShell,
                        SEARCH_ROW_GROUP,
                        "rounded-none px-4 py-4 hover:bg-muted/50",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      )}
                    >
                      <SearchResultRow
                        entry={hit.entry}
                        query={query}
                        matches={hit.matches}
                        variant="page"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
