import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AnimatedItem, AnimatedList, AnimatedSection } from "@/components/animations/animated-section";
import { ProgressSummary, type ProgressChapter } from "@/components/dashboard/dashboard-metrics";
import { DomainCard } from "@/components/dashboard/domain-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { TRACK_COLOR, TRACK_SHORT } from "@/lib/nav";
import { getTrackGroup, getTrackGroups } from "@/lib/content";
import { cappedStagger } from "@/lib/motion";
import { TRACK_DESCRIPTIONS, TRACK_LABELS } from "@/lib/types";

export function generateStaticParams() {
  return getTrackGroups().map((g) => ({ track: g.track }));
}

export function generateMetadata({ params }: { params: { track: string } }): Metadata {
  const group = getTrackGroup(params.track);
  if (!group) return {};
  return {
    title: TRACK_LABELS[group.track],
    description: TRACK_DESCRIPTIONS[group.track],
  };
}

export default function TrackPage({ params }: { params: { track: string } }) {
  const group = getTrackGroup(params.track);
  if (!group) notFound();

  const chapters: ProgressChapter[] = group.domains.flatMap((domain) =>
    domain.chapters.map((c) => ({ slug: c.slug, readingTime: c.readingTime }))
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-10">
      <PageHeader
        eyebrow="Track"
        title={TRACK_LABELS[group.track]}
        dek={TRACK_DESCRIPTIONS[group.track]}
        meta={`${group.chapterCount} chapters · ${group.domains.length} domains`}
        dotClassName={TRACK_COLOR[group.track]?.bg}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: TRACK_SHORT[group.track] }]}
      />

      <AnimatedSection className="mt-8" tight>
        <ProgressSummary
          chapters={chapters}
          label={`${TRACK_SHORT[group.track]} track`}
          colorClassName={TRACK_COLOR[group.track]?.ring}
          fillClassName={TRACK_COLOR[group.track]?.bg}
        />
      </AnimatedSection>

      <section aria-labelledby="domains-heading" className="mt-10">
        <AnimatedSection as="header" tight>
          <h2 id="domains-heading" className="text-base font-semibold tracking-display sm:text-lg">
            Domains
          </h2>
        </AnimatedSection>

        {/* The grid's single cascade (L3). `cappedStagger` shrinks the step as the
            domain count grows, so a six-tile and a sixteen-tile track both finish
            landing inside 300ms and read as one gesture. */}
        <AnimatedList
          stagger={cappedStagger(group.domains.length)}
          className="mt-5 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {group.domains.map((domain) => (
            <AnimatedItem key={domain.domain.key} className="h-full">
              <DomainCard
                track={group.track}
                domainKey={domain.domain.key}
                title={domain.domain.title}
                chapterSlugs={domain.chapters.map((c) => c.slug)}
              />
            </AnimatedItem>
          ))}
        </AnimatedList>
      </section>
    </main>
  );
}
