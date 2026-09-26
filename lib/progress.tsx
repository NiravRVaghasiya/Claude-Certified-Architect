"use client";

import * as React from "react";

/* Existing keys — do not rename. Progress written by earlier versions of the
   app must keep loading. New state goes in additive keys. */
const STORAGE_KEY = "ccar:progress:v1";
const LAST_VISITED_KEY = "ccar:last-visited:v1";
const COMPLETED_AT_KEY = "ccar:completed-at:v1";
const ACTIVITY_KEY = "ccar:activity:v1";

const MAX_ACTIVITY_DAYS = 400;

interface ProgressContextValue {
  hydrated: boolean;
  completed: Set<string>;
  completedAt: Record<string, number>;
  isComplete: (slug: string) => boolean;
  toggleComplete: (slug: string) => void;
  markComplete: (slug: string) => void;
  /** Completion percentage (0–100, rounded) for an arbitrary set of slugs. */
  percentOf: (slugs: string[]) => number;
  /** Number of completed slugs in the given set. */
  countOf: (slugs: string[]) => number;
  lastVisited: string | null;
  setLastVisited: (slug: string) => void;
  /** Consecutive days with study activity, ending today or yesterday. */
  streak: number;
  /** Local YYYY-MM-DD days with recorded activity, most recent first. */
  activeDays: string[];
  /** Slugs completed most recently first (only those with a recorded time). */
  recentlyCompleted: string[];
}

const ProgressContext = React.createContext<ProgressContextValue | null>(null);

function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shiftDay(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + days);
  return dayKey(date);
}

/** Consecutive-day run ending today (or yesterday, so an in-progress day counts). */
function computeStreak(days: string[]): number {
  if (days.length === 0) return 0;
  const set = new Set(days);
  const today = dayKey(new Date());
  let cursor = set.has(today) ? today : shiftDay(today, -1);
  if (!set.has(cursor)) return 0;
  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = shiftDay(cursor, -1);
  }
  return streak;
}

/**
 * Reads and *shape-checks* stored JSON. A hand-edited or half-written value would
 * otherwise reach `new Set(...)` / the streak math and take the whole provider
 * (and with it every page) down, with no way for the reader to recover.
 */
function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(fallback)) {
      if (!Array.isArray(parsed)) return fallback;
      return parsed.filter((v): v is string => typeof v === "string") as T;
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable (private mode, quota) — state just won't persist.
  }
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = React.useState(false);
  const [completed, setCompleted] = React.useState<Set<string>>(new Set());
  const [completedAt, setCompletedAt] = React.useState<Record<string, number>>({});
  const [activeDays, setActiveDays] = React.useState<string[]>([]);
  const [lastVisited, setLastVisitedState] = React.useState<string | null>(null);

  React.useEffect(() => {
    setCompleted(new Set(read<string[]>(STORAGE_KEY, [])));
    setCompletedAt(read<Record<string, number>>(COMPLETED_AT_KEY, {}));
    setActiveDays(read<string[]>(ACTIVITY_KEY, []));
    try {
      setLastVisitedState(window.localStorage.getItem(LAST_VISITED_KEY));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  /*
   * Every writer below merges with what is already in localStorage instead of
   * trusting React state. Child effects run before the provider's own load
   * effect, so `VisitTracker` can call in while state is still the empty initial
   * value — writing that straight back would erase the reader's history.
   */

  /** Records "the user studied today" — drives the streak. Idempotent per day. */
  const recordActivity = React.useCallback(() => {
    const today = dayKey(new Date());
    setActiveDays((prev) => {
      const merged = [...new Set([today, ...prev, ...read<string[]>(ACTIVITY_KEY, [])])]
        // YYYY-MM-DD sorts lexicographically, so this is most-recent-first.
        .sort()
        .reverse()
        .slice(0, MAX_ACTIVITY_DAYS);
      if (merged.length === prev.length && merged.every((d, i) => d === prev[i])) return prev;
      write(ACTIVITY_KEY, merged);
      return merged;
    });
  }, []);

  /** Current completions, reconciled with storage. */
  const readCompleted = React.useCallback(
    () => new Set([...read<string[]>(STORAGE_KEY, []), ...completed]),
    [completed]
  );

  const stampCompletion = React.useCallback((slug: string, done: boolean) => {
    setCompletedAt((prev) => {
      const next = { ...read<Record<string, number>>(COMPLETED_AT_KEY, {}), ...prev };
      if (done) next[slug] = Date.now();
      else delete next[slug];
      write(COMPLETED_AT_KEY, next);
      return next;
    });
  }, []);

  const toggleComplete = React.useCallback(
    (slug: string) => {
      const next = readCompleted();
      const willComplete = !next.has(slug);
      if (willComplete) next.add(slug);
      else next.delete(slug);
      setCompleted(next);
      write(STORAGE_KEY, [...next]);
      stampCompletion(slug, willComplete);
      if (willComplete) recordActivity();
    },
    [readCompleted, stampCompletion, recordActivity]
  );

  const markComplete = React.useCallback(
    (slug: string) => {
      const next = readCompleted();
      if (next.has(slug)) return;
      next.add(slug);
      setCompleted(next);
      write(STORAGE_KEY, [...next]);
      stampCompletion(slug, true);
      recordActivity();
    },
    [readCompleted, stampCompletion, recordActivity]
  );

  const setLastVisited = React.useCallback(
    (slug: string) => {
      setLastVisitedState(slug);
      try {
        window.localStorage.setItem(LAST_VISITED_KEY, slug);
      } catch {
        /* ignore */
      }
      recordActivity();
    },
    [recordActivity]
  );

  const value = React.useMemo<ProgressContextValue>(() => {
    const recentlyCompleted = Object.entries(completedAt)
      .filter(([slug]) => completed.has(slug))
      .sort((a, b) => b[1] - a[1])
      .map(([slug]) => slug);

    return {
      hydrated,
      completed,
      completedAt,
      isComplete: (slug) => completed.has(slug),
      toggleComplete,
      markComplete,
      percentOf: (slugs) =>
        slugs.length === 0
          ? 0
          : Math.round((slugs.filter((s) => completed.has(s)).length / slugs.length) * 100),
      countOf: (slugs) => slugs.filter((s) => completed.has(s)).length,
      lastVisited,
      setLastVisited,
      streak: computeStreak(activeDays),
      activeDays,
      recentlyCompleted,
    };
  }, [
    hydrated,
    completed,
    completedAt,
    activeDays,
    toggleComplete,
    markComplete,
    lastVisited,
    setLastVisited,
  ]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = React.useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within a ProgressProvider");
  return ctx;
}
