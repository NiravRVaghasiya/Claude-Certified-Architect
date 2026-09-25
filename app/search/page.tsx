"use client";

import * as React from "react";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { useSearchIndex } from "@/lib/search";

export default function SearchPage() {
  const [query, setQuery] = React.useState("");
  const { fuse, entries, load } = useSearchIndex();

  React.useEffect(() => {
    load();
  }, [load]);

  const results = React.useMemo(() => {
    if (!fuse) return [];
    if (!query.trim()) return entries;
    return fuse.search(query, { limit: 40 }).map((r) => r.item);
  }, [fuse, entries, query]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-fluid-2xl font-bold tracking-tight">Search</h1>
      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
        <SearchIcon className="h-4 w-4 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chapters, sections, topics…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          aria-label="Search chapters"
        />
      </div>

      <ul className="mt-6 space-y-2">
        {results.map((entry) => (
          <li key={entry.slug}>
            <Link
              href={`/chapters/${entry.slug}`}
              className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {entry.domain}
              </p>
              <p className="mt-1 font-medium">
                Ch. {entry.chapterNumber} · {entry.title}
              </p>
              {entry.dek && <p className="mt-1 text-sm text-muted-foreground">{entry.dek}</p>}
            </Link>
          </li>
        ))}
        {query.trim() && results.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">No chapters found.</p>
        )}
      </ul>
    </main>
  );
}
