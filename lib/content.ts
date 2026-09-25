import fs from "node:fs";
import path from "node:path";
import type { Chapter, ChapterSummary, DomainGroup, Track, TrackGroup } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content");

let manifestCache: ChapterSummary[] | null = null;

/** All chapters, ordered by chapterNumber. Server-only (reads content/ from disk). */
export function getManifest(): ChapterSummary[] {
  if (manifestCache) return manifestCache;
  const raw = fs.readFileSync(path.join(CONTENT_DIR, "manifest.json"), "utf-8");
  manifestCache = JSON.parse(raw) as ChapterSummary[];
  return manifestCache;
}

export function getChapterBySlug(slug: string): Chapter {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, "chapters", `${slug}.json`), "utf-8");
  return JSON.parse(raw) as Chapter;
}

export function getAllSlugs(): string[] {
  return getManifest().map((c) => c.slug);
}

const TRACK_ORDER: Track[] = ["core", "foundation", "professional"];

export function getTrackGroups(): TrackGroup[] {
  const manifest = getManifest();
  return TRACK_ORDER.map((track) => buildTrackGroup(track, manifest)).filter(
    (g): g is TrackGroup => g !== null
  );
}

function buildTrackGroup(track: Track, manifest: ChapterSummary[]): TrackGroup | null {
  const chapters = manifest.filter((c) => c.track === track);
  if (chapters.length === 0) return null;

  const domainOrder: string[] = [];
  const byDomainKey = new Map<string, ChapterSummary[]>();
  for (const chapter of chapters) {
    const key = chapter.domain.key;
    if (!byDomainKey.has(key)) {
      byDomainKey.set(key, []);
      domainOrder.push(key);
    }
    byDomainKey.get(key)!.push(chapter);
  }

  const domains: DomainGroup[] = domainOrder.map((key) => {
    const domainChapters = byDomainKey.get(key)!;
    return { domain: domainChapters[0].domain, track, chapters: domainChapters };
  });

  return { track, domains, chapterCount: chapters.length };
}

export function getTrackGroup(track: string): TrackGroup | undefined {
  return getTrackGroups().find((g) => g.track === track);
}

export function getDomainGroup(track: string, domainKey: string): DomainGroup | undefined {
  return getTrackGroup(track)?.domains.find((d) => d.domain.key === domainKey);
}

export function getAdjacentChapters(chapterNumber: number): {
  prev: ChapterSummary | null;
  next: ChapterSummary | null;
} {
  const manifest = getManifest();
  const index = manifest.findIndex((c) => c.chapterNumber === chapterNumber);
  return {
    prev: index > 0 ? manifest[index - 1] : null,
    next: index >= 0 && index < manifest.length - 1 ? manifest[index + 1] : null,
  };
}

export function getStats() {
  const groups = getTrackGroups();
  const domainCount = groups.reduce((sum, g) => sum + g.domains.length, 0);
  return {
    chapterCount: getManifest().length,
    trackCount: groups.length,
    domainCount,
  };
}
