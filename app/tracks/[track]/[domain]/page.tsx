import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AnimatedItem, AnimatedList, AnimatedSection } from "@/components/animations/animated-section";
import { ChapterCard } from "@/components/dashboard/chapter-card";
import { ProgressSummary, type ProgressChapter } from "@/components/dashboard/dashboard-metrics";
import { PageHeader } from "@/components/dashboard/page-header";
import { TRACK_COLOR, TRACK_SHORT } from "@/lib/nav";
import { getDomainGroup, getTrackGroups } from "@/lib/content";
import { TRACK_LABELS } from "@/lib/types";

export function generateStaticParams() {
  return getTrackGroups().flatMap((group) =>
    group.domains.map((domain) => ({ track: group.track, domain: domain.domain.key }))
  );
}

export function generateMetadata({
  params,
}: {
  params: { track: string; domain: string };
}): Metadata {
  const group = getDomainGroup(params.track, params.domain);
  if (!group) return {};
  return {
    title: group.domain.title,
    description: `${group.chapters.length} chapters in ${group.domain.title} (${TRACK_LABELS[group.track]}).`,
  };
}

export default function DomainPage({ params }: { params: { track: string; domain: string } }) {
  const group = getDomainGroup(params.track, params.domain);
  if (!group) notFound();

  const chapters: ProgressChapter[] = group.chapters.map((c) => ({
    slug: c.slug,
    readingTime: c.readingTime,
  }));
  const totalMinutes = group.chapters.reduce((sum, c) => sum + c.readingTime, 0);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-10">
      <PageHeader
        eyebrow="Domain"
        title={group.domain.title}
        meta={`${group.chapters.length} chapters · ${totalMinutes} min of reading`}
        dotClassName={TRACK_COLOR[group.track]?.bg}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: TRACK_SHORT[group.track], href: `/tracks/${group.track}` },
          { label: group.domain.title },
        ]}
      />

      <AnimatedSection className="mt-8" tight>
        <ProgressSummary
          chapters={chapters}
          label={group.domain.title}
          colorClassName={TRACK_COLOR[group.track]?.ring}
          fillClassName={TRACK_COLOR[group.track]?.bg}
        />
      </AnimatedSection>

      <section aria-labelledby="chapters-heading" className="mt-10">
        <AnimatedSection as="header" tight>
          <h2 id="chapters-heading" className="text-base font-semibold tracking-display sm:text-lg">
            Chapters
          </h2>
        </AnimatedSection>

        <AnimatedList className="mt-5 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {group.chapters.map((chapter) => (
            <AnimatedItem key={chapter.slug} className="h-full">
              <ChapterCard
                chapter={{
                  slug: chapter.slug,
                  chapterNumber: chapter.chapterNumber,
                  title: chapter.title,
                  dek: chapter.dek,
                  readingTime: chapter.readingTime,
                }}
              />
            </AnimatedItem>
          ))}
        </AnimatedList>
      </section>
    </main>
  );
}
