import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AnimatedSection } from "@/components/animations/animated-section";
import { ChapterBody } from "@/components/chapter/chapter-body";
import { ChapterHeader } from "@/components/chapter/chapter-header";
import { ChapterTOC } from "@/components/chapter/chapter-toc";
import { ReadingProgress } from "@/components/chapter/reading-progress";
import { RelatedChapters } from "@/components/chapter/related-chapters";
import { VisitTracker } from "@/components/chapter/visit-tracker";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { ChapterNavigation } from "@/components/navigation/chapter-navigation";
import { getAdjacentChapters, getAllSlugs, getChapterBySlug, getDomainGroup } from "@/lib/content";
import { TRACK_LABELS, type Chapter, type ChapterSummary } from "@/lib/types";
// Only the reader needs these ~70 kB; a page-level import keeps them off every
// other route while still loading after the layout's globals.css.
import "../../chapter-prose.css";
import "../../chapter-blocks.css";

const RELATED_LIMIT = 4;

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

/** `getChapterBySlug` throws on an unknown slug (missing content file). */
function readChapter(slug: string): Chapter | null {
  try {
    return getChapterBySlug(slug);
  } catch {
    return null;
  }
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const chapter = readChapter(params.slug);
  if (!chapter) return {};

  const description = chapter.dek ?? `Chapter ${chapter.chapterNumber} of the CCAR study guide.`;
  return {
    title: `${chapter.chapterNumber}. ${chapter.title}`,
    description,
    openGraph: { title: chapter.title, description, type: "article" },
  };
}

/**
 * Sibling chapters in the same domain, topped up with the reading-order
 * neighbours when the domain is too small to fill the row.
 */
function pickRelated(chapter: Chapter, neighbours: Array<ChapterSummary | null>): ChapterSummary[] {
  const seen = new Set([chapter.slug]);
  const related: ChapterSummary[] = [];

  const domain = getDomainGroup(chapter.track, chapter.domain.key);
  for (const candidate of domain?.chapters ?? []) {
    if (related.length === RELATED_LIMIT) break;
    if (seen.has(candidate.slug)) continue;
    seen.add(candidate.slug);
    related.push(candidate);
  }

  for (const candidate of neighbours) {
    if (related.length === RELATED_LIMIT) break;
    if (!candidate || seen.has(candidate.slug)) continue;
    seen.add(candidate.slug);
    related.push(candidate);
  }

  return related;
}

export default function ChapterPage({ params }: { params: { slug: string } }) {
  const chapter = readChapter(params.slug);
  if (!chapter) notFound();

  const { prev, next } = getAdjacentChapters(chapter.chapterNumber);
  const related = pickRelated(chapter, [next, prev]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-10">
      <VisitTracker slug={chapter.slug} />
      <ReadingProgress />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: TRACK_LABELS[chapter.track], href: `/tracks/${chapter.track}` },
          { label: chapter.domain.title, href: `/tracks/${chapter.track}/${chapter.domain.key}` },
          { label: `Ch. ${chapter.chapterNumber}` },
        ]}
      />

      {/* The rail only earns its 15rem from xl up: at exactly lg the 17.5rem sidebar
          would squeeze the reading column to ~384px. */}
      <div className="mt-6 grid gap-10 xl:grid-cols-[minmax(0,1fr)_15rem] xl:gap-14">
        {/* Reading column, capped for line length rather than filling the grid. */}
        <article className="min-w-0 max-w-prose">
          <ChapterHeader chapter={chapter} />

          {/* The rail is the outline on lg+; below that it collapses inline. */}
          <ChapterTOC
            sections={chapter.sections}
            instanceId="inline"
            collapsible
            className="mt-8 xl:hidden"
          />

          <AnimatedSection immediate delay={0.16} className="mt-8">
            <ChapterBody html={chapter.bodyHtml} />
          </AnimatedSection>

          <RelatedChapters chapters={related} />
          <ChapterNavigation prev={prev} next={next} />
        </article>

        <aside className="hidden xl:block">
          <div className="sticky top-[calc(var(--header-h)+2.5rem)]">
            <ChapterTOC sections={chapter.sections} instanceId="rail" />
          </div>
        </aside>
      </div>
    </main>
  );
}
