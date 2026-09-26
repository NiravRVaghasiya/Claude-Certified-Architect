import type { ChapterSummary, DomainGroup, TrackGroup } from "./types";

export interface ActiveLocation {
  track: TrackGroup | null;
  domain: DomainGroup | null;
  chapter: ChapterSummary | null;
}

const EMPTY: ActiveLocation = { track: null, domain: null, chapter: null };

/**
 * Resolves the current route to its place in the content tree, so the header,
 * sidebar, and breadcrumbs all derive "where am I" from one implementation.
 *
 * Handles `/chapters/<slug>`, `/tracks/<track>` and `/tracks/<track>/<domain>`.
 */
export function findActive(groups: TrackGroup[], pathname: string | null): ActiveLocation {
  if (!pathname) return EMPTY;

  const chapterMatch = pathname.match(/^\/chapters\/([^/]+)/);
  if (chapterMatch) {
    const slug = decodeURIComponent(chapterMatch[1]);
    for (const track of groups) {
      for (const domain of track.domains) {
        const chapter = domain.chapters.find((c) => c.slug === slug);
        if (chapter) return { track, domain, chapter };
      }
    }
    return EMPTY;
  }

  const trackMatch = pathname.match(/^\/tracks\/([^/]+)(?:\/([^/]+))?/);
  if (trackMatch) {
    const track = groups.find((g) => g.track === trackMatch[1]) ?? null;
    if (!track) return EMPTY;
    const domain = trackMatch[2]
      ? track.domains.find((d) => d.domain.key === trackMatch[2]) ?? null
      : null;
    return { track, domain, chapter: null };
  }

  return EMPTY;
}

/** Every chapter slug in a set of track groups, in reading order. */
export function slugsOf(groups: TrackGroup[]): string[] {
  return groups.flatMap((g) => g.domains.flatMap((d) => d.chapters.map((c) => c.slug)));
}

export const TRACK_COLOR: Record<string, { text: string; bg: string; ring: string }> = {
  core: { text: "text-muted-foreground", bg: "bg-muted-foreground", ring: "text-muted-foreground" },
  foundation: { text: "text-foundation", bg: "bg-foundation", ring: "text-foundation" },
  professional: { text: "text-professional", bg: "bg-professional", ring: "text-professional" },
};

/** Short track label for chips and rails ("Core", "Foundation", "Professional"). */
export const TRACK_SHORT: Record<string, string> = {
  core: "Core",
  foundation: "Foundation",
  professional: "Professional",
};
