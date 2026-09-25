import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { DomainCard } from "@/components/domain-card";
import { RevealGroup, RevealItem } from "@/components/reveal";
import { getTrackGroup, getTrackGroups } from "@/lib/content";
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

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: TRACK_LABELS[group.track] }]} />
      <h1 className="mt-4 text-fluid-2xl font-bold tracking-tight">{TRACK_LABELS[group.track]}</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">{TRACK_DESCRIPTIONS[group.track]}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        {group.chapterCount} chapters across {group.domains.length} domains
      </p>

      <RevealGroup className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {group.domains.map((domain) => (
          <RevealItem key={domain.domain.key}>
            <DomainCard group={domain} />
          </RevealItem>
        ))}
      </RevealGroup>
    </main>
  );
}
