"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Search, TriangleAlert, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SEARCH_ROW_GROUP,
  SearchResultRow,
  SearchSkeletonRows,
  searchRowShell,
} from "@/components/search/search-result-row";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { durations, fadeUpTight, scaleIn, staggerContainer } from "@/lib/motion";
import { TRACK_SHORT } from "@/lib/nav";
import { useProgress } from "@/lib/progress";
import {
  PALETTE_LIMIT,
  groupHitsByTrack,
  searchEntries,
  toHits,
  useSearchIndex,
  type SearchHit,
} from "@/lib/search";
import type { SearchIndexEntry } from "@/lib/types";
import { useMotionSafe } from "@/lib/use-motion";
import { cn } from "@/lib/utils";

/** How many chapters the idle "Jump to" list offers. */
const IDLE_COUNT = 6;
/** Total length of the results cascade, however many rows there are. */
const CASCADE_BUDGET = 0.3;

/**
 * `"⌘"` on Apple platforms, `"Ctrl"` elsewhere, `null` until mounted.
 *
 * Callers must render something width-stable for `null`: the server has no way
 * to know the platform, so guessing would either mismatch hydration or reflow
 * the header the moment it resolves.
 */
export function useModifierLabel(): string | null {
  const [label, setLabel] = React.useState<string | null>(null);

  React.useEffect(() => {
    const platform = `${navigator.platform} ${navigator.userAgent}`;
    setLabel(/Mac|iPhone|iPad|iPod/i.test(platform) ? "⌘" : "Ctrl");
  }, []);

  return label;
}

/** The shortcut as it should read on a keycap. */
export function shortcutLabel(modifier: string | null): string {
  if (modifier === null) return " ";
  return modifier === "⌘" ? "⌘K" : "Ctrl K";
}

function isTextEntry(target: EventTarget | null): target is HTMLElement {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/**
 * The ⌘K command palette plus both of its triggers (a labelled button from `sm`
 * up, an icon button below it).
 *
 * Radix owns the focus trap, escape, and scroll lock; cmdk owns list semantics
 * and ↑/↓/↵; framer owns the movement. Nothing here is required to search — the
 * `/search` route is the no-JS-motion fallback and shares the same result row.
 */
export function SearchCommand({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();
  const motionSafe = useMotionSafe();
  const modifier = useModifierLabel();
  const { fuse, entries, loading, error, load, retry } = useSearchIndex();
  const { lastVisited, recentlyCompleted } = useProgress();

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return;
      // In someone else's text field the shortcut belongs to that field. Inside
      // the palette's own input it still toggles, which is how it closes.
      if (isTextEntry(event.target) && !event.target.closest("[data-search-palette]")) return;
      event.preventDefault();
      setOpen((value) => !value);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    if (open) load();
  }, [open, load]);

  const hits = React.useMemo(() => searchEntries(fuse, query, PALETTE_LIMIT), [fuse, query]);
  const groups = React.useMemo(() => groupHitsByTrack(hits), [hits]);

  /** Where the reader most likely wants to go before they've typed anything. */
  const idle = React.useMemo<SearchHit[]>(() => {
    if (entries.length === 0) return [];
    const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));
    const picked: SearchIndexEntry[] = [];

    const add = (slug: string | null | undefined) => {
      if (!slug || picked.length >= IDLE_COUNT) return;
      const entry = bySlug.get(slug);
      if (entry && !picked.some((p) => p.slug === entry.slug)) picked.push(entry);
    };

    add(lastVisited);
    recentlyCompleted.forEach(add);
    entries.forEach((entry) => add(entry.slug));
    return toHits(picked);
  }, [entries, lastVisited, recentlyCompleted]);

  const go = React.useCallback(
    (slug: string) => {
      setOpen(false);
      router.push(`/chapters/${slug}`);
    },
    [router]
  );

  const trimmed = query.trim();
  const showResults = trimmed.length > 0;
  const showSkeleton = loading && entries.length === 0;
  const showEmpty = !showSkeleton && !error && showResults && hits.length === 0;
  const rows = showResults ? hits : idle;
  const stagger = Math.min(0.02, CASCADE_BUDGET / Math.max(rows.length, 1));

  const renderRow = (hit: SearchHit) => (
    <Command.Item
      key={hit.entry.slug}
      value={hit.entry.slug}
      onSelect={() => go(hit.entry.slug)}
      className={cn(
        searchRowShell,
        SEARCH_ROW_GROUP,
        "cursor-pointer outline-none data-[selected=true]:bg-muted"
      )}
    >
      <motion.span variants={fadeUpTight} className="block">
        <SearchResultRow entry={hit.entry} query={query} matches={hit.matches} />
      </motion.span>
    </Command.Item>
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button
          variant="outline"
          size="sm"
          // Fetching the index on intent means the first keystroke is never the
          // thing waiting on the network.
          onPointerEnter={load}
          onFocus={load}
          className={cn("hidden text-muted-foreground sm:inline-flex", className)}
        >
          <Search aria-hidden="true" />
          <span>Search</span>
          <Kbd className="min-w-[3rem]">{shortcutLabel(modifier)}</Kbd>
        </Button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Trigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Search chapters"
          onPointerEnter={load}
          onFocus={load}
          className={cn("text-muted-foreground hover:text-foreground sm:hidden", className)}
        >
          <Search className="size-[1.125rem]" aria-hidden="true" />
        </Button>
      </DialogPrimitive.Trigger>

      {/* Resetting only once the panel has fully left keeps the closing frames
          showing the results the reader just acted on. */}
      <AnimatePresence onExitComplete={() => setQuery("")}>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-background/75 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: durations.base }}
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild forceMount aria-describedby={undefined}>
              {/* Positioning lives on this wrapper: framer writes an inline
                  transform on the panel, which would silently override a
                  Tailwind `-translate-x-1/2`. The wrapper is sized to the panel
                  exactly so no invisible band swallows click-to-dismiss. */}
              <div className="fixed inset-x-0 top-0 z-50 sm:inset-x-auto sm:left-1/2 sm:top-[11vh] sm:w-[min(42rem,calc(100%_-_2rem))] sm:-translate-x-1/2">
                <motion.div
                  data-search-palette=""
                  variants={scaleIn}
                  initial={motionSafe ? "hidden" : false}
                  animate="visible"
                  exit="exit"
                  className="w-full"
                >
                  <DialogPrimitive.Title className="sr-only">Search chapters</DialogPrimitive.Title>

                  <Command
                    label="Search chapters"
                    shouldFilter={false}
                    loop
                    // cmdk's vim bindings claim ctrl+k for "move up", which would
                    // fight the shortcut that opened this dialog.
                    vimBindings={false}
                    className="flex max-h-[calc(100dvh-3rem)] w-full flex-col overflow-hidden border-b border-border bg-card pt-[env(safe-area-inset-top)] shadow-lg sm:max-h-[min(32rem,72dvh)] sm:rounded-2xl sm:border sm:pt-0"
                  >
                    <div className="flex shrink-0 items-center gap-2.5 border-b border-border px-4">
                      <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <Command.Input
                        ref={inputRef}
                        autoFocus
                        value={query}
                        onValueChange={setQuery}
                        aria-label="Search chapters"
                        placeholder="Search chapters, sections, topics…"
                        className="h-14 w-full bg-transparent text-fluid-base text-foreground outline-none placeholder:text-muted-foreground sm:h-12 sm:text-sm"
                      />
                      {query.length > 0 && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Clear query"
                          className="-mr-1.5 shrink-0 text-muted-foreground"
                          onClick={() => {
                            setQuery("");
                            inputRef.current?.focus();
                          }}
                        >
                          <X aria-hidden="true" />
                        </Button>
                      )}
                    </div>

                    {/* Outside the listbox: a live region is not a valid option. */}
                    <span className="sr-only" aria-live="polite">
                      {showSkeleton
                        ? "Loading search index"
                        : showResults
                          ? `${hits.length} ${hits.length === 1 ? "result" : "results"} for ${trimmed}`
                          : ""}
                    </span>

                    <Command.List className="scroll-rail min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pb-2">
                      {error ? (
                        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                          <TriangleAlert className="size-5 text-warning" aria-hidden="true" />
                          <p className="text-sm text-muted-foreground">
                            The search index didn&apos;t load.
                          </p>
                          <Button variant="outline" size="sm" onClick={retry}>
                            Try again
                          </Button>
                        </div>
                      ) : showSkeleton ? (
                        <SearchSkeletonRows count={5} />
                      ) : showEmpty ? (
                        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                          <p className="text-sm font-medium text-foreground">No chapters match</p>
                          <p className="max-w-xs text-xs text-muted-foreground">
                            Nothing across the {entries.length} chapters matches
                            <span className="text-foreground"> “{trimmed}”</span>. Try a shorter or
                            more general term.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setQuery("");
                              inputRef.current?.focus();
                            }}
                          >
                            Clear query
                          </Button>
                        </div>
                      ) : (
                        rows.length > 0 && (
                          // Mounts with its children present, so the cascade runs
                          // once per results set rather than on every keystroke —
                          // rows are keyed by slug, so carried-over rows hold still.
                          <motion.div
                            variants={staggerContainer(stagger)}
                            initial={motionSafe ? "hidden" : false}
                            animate="visible"
                          >
                            {showResults ? (
                              groups.map((group) => (
                                <Command.Group
                                  key={group.track}
                                  heading={
                                    <span className="eyebrow">
                                      {TRACK_SHORT[group.track]}
                                      <span className="ml-1.5 tabular text-muted-foreground">
                                        {group.hits.length}
                                      </span>
                                    </span>
                                  }
                                  className="[&_[cmdk-group-heading]]:sticky [&_[cmdk-group-heading]]:top-0 [&_[cmdk-group-heading]]:z-10 [&_[cmdk-group-heading]]:-mx-2 [&_[cmdk-group-heading]]:border-b [&_[cmdk-group-heading]]:border-border/60 [&_[cmdk-group-heading]]:bg-card/95 [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:backdrop-blur-sm"
                                >
                                  {group.hits.map(renderRow)}
                                </Command.Group>
                              ))
                            ) : (
                              <Command.Group
                                heading={<span className="eyebrow">Jump to</span>}
                                className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-1.5"
                              >
                                {idle.map(renderRow)}
                              </Command.Group>
                            )}
                          </motion.div>
                        )
                      )}
                    </Command.List>

                    {/* Desktop only: on touch these hints describe keys that aren't there. */}
                    <div className="hidden shrink-0 items-center justify-between gap-4 border-t border-border bg-muted-subtle px-4 py-2 sm:flex">
                      <span className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Kbd>↑</Kbd>
                          <Kbd>↓</Kbd>
                          <span className="eyebrow">navigate</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Kbd>↵</Kbd>
                          <span className="eyebrow">open</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Kbd>esc</Kbd>
                          <span className="eyebrow">close</span>
                        </span>
                      </span>
                      <Link
                        href="/search"
                        onClick={() => setOpen(false)}
                        className="eyebrow flex items-center gap-1 rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        All results
                        <ArrowUpRight className="size-3" aria-hidden="true" />
                      </Link>
                    </div>
                  </Command>
                </motion.div>
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
