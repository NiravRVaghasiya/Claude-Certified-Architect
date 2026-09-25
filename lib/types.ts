export type Track = "core" | "foundation" | "professional";

export interface DomainMeta {
  key: string;
  title: string;
}

export interface SectionHeading {
  id: string;
  title: string;
  level: 2 | 3;
}

export interface ChapterSummary {
  slug: string;
  chapterNumber: number;
  title: string;
  dek: string | null;
  track: Track;
  domain: DomainMeta;
  sections: SectionHeading[];
  readingTime: number;
  wordCount: number;
}

export interface Chapter extends ChapterSummary {
  bodyHtml: string;
  plainText: string;
}

export interface SearchIndexEntry {
  slug: string;
  chapterNumber: number;
  title: string;
  dek: string | null;
  track: Track;
  domain: string;
  sections: string[];
  excerpt: string;
}

export interface DomainGroup {
  domain: DomainMeta;
  track: Track;
  chapters: ChapterSummary[];
}

export interface TrackGroup {
  track: Track;
  domains: DomainGroup[];
  chapterCount: number;
}

export const TRACK_LABELS: Record<Track, string> = {
  core: "Core",
  foundation: "Foundation (CCAR-F)",
  professional: "Professional (CCAR-P)",
};

export const TRACK_DESCRIPTIONS: Record<Track, string> = {
  core: "Ecosystem orientation and exam-strategy chapters that sit outside either certification track.",
  foundation:
    "Agentic architecture, tool design, Claude Code workflows, prompt engineering, and context management — the CCAR-F domains.",
  professional:
    "Solution design, evaluation, governance, and stakeholder lifecycle management for production Claude systems — the CCAR-P domains.",
};
