"use client";

import * as React from "react";

const STORAGE_KEY = "ccar:progress:v1";
const LAST_VISITED_KEY = "ccar:last-visited:v1";

interface ProgressContextValue {
  hydrated: boolean;
  completed: Set<string>;
  isComplete: (slug: string) => boolean;
  toggleComplete: (slug: string) => void;
  markComplete: (slug: string) => void;
  percentOf: (slugs: string[]) => number;
  lastVisited: string | null;
  setLastVisited: (slug: string) => void;
}

const ProgressContext = React.createContext<ProgressContextValue | null>(null);

function readSet(): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = React.useState(false);
  const [completed, setCompleted] = React.useState<Set<string>>(new Set());
  const [lastVisited, setLastVisitedState] = React.useState<string | null>(null);

  React.useEffect(() => {
    setCompleted(readSet());
    setLastVisitedState(window.localStorage.getItem(LAST_VISITED_KEY));
    setHydrated(true);
  }, []);

  const persist = React.useCallback((next: Set<string>) => {
    setCompleted(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    } catch {
      // localStorage unavailable (private mode, quota) — progress just won't persist.
    }
  }, []);

  const toggleComplete = React.useCallback(
    (slug: string) => {
      const next = new Set(completed);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      persist(next);
    },
    [completed, persist]
  );

  const markComplete = React.useCallback(
    (slug: string) => {
      if (completed.has(slug)) return;
      persist(new Set(completed).add(slug));
    },
    [completed, persist]
  );

  const setLastVisited = React.useCallback((slug: string) => {
    setLastVisitedState(slug);
    try {
      window.localStorage.setItem(LAST_VISITED_KEY, slug);
    } catch {
      // ignore
    }
  }, []);

  const value = React.useMemo<ProgressContextValue>(
    () => ({
      hydrated,
      completed,
      isComplete: (slug) => completed.has(slug),
      toggleComplete,
      markComplete,
      percentOf: (slugs) =>
        slugs.length === 0
          ? 0
          : Math.round((slugs.filter((s) => completed.has(s)).length / slugs.length) * 100),
      lastVisited,
      setLastVisited,
    }),
    [hydrated, completed, toggleComplete, markComplete, lastVisited, setLastVisited]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = React.useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within a ProgressProvider");
  return ctx;
}
