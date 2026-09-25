import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ChapterCard } from "@/components/chapter-card";
import { RevealGroup, RevealItem } from "@/components/reveal";
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

export default function DomainPage({
  params,
}: {
  params: { track: string; domain: string };
}) {
  const group = getDomainGroup(params.track, params.domain);
  if (!group) notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: TRACK_LABELS[group.track], href: `/tracks/${group.track}` },
          { label: group.domain.title },
        ]}
      />
      <h1 className="mt-4 text-fluid-2xl font-bold tracking-tight">{group.domain.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{group.chapters.length} chapters</p>

      <RevealGroup className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {group.chapters.map((chapter) => (
          <RevealItem key={chapter.slug}>
            <ChapterCard chapter={chapter} />
          </RevealItem>
        ))}
      </RevealGroup>
    </main>
  );
}
