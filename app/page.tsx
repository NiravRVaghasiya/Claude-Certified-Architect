import Link from "next/link";
import { AnimatedItem, AnimatedList, AnimatedSection } from "@/components/animations/animated-section";
import {
  DashboardMetrics,
  type ProgressChapter,
} from "@/components/dashboard/dashboard-metrics";
import {
  ContinueCard,
  ContinueCta,
  type ContinueChapter,
} from "@/components/dashboard/continue-card";
import {
  DomainProgress,
  type DomainProgressTrack,
} from "@/components/dashboard/domain-progress";
import { TrackCard } from "@/components/dashboard/track-card";
import { Button } from "@/components/ui/button";
import { getManifest, getStats, getTrackGroups } from "@/lib/content";

/**
 * Dashboard. Content is read on the server and handed to the client cards as
 * narrow plain objects — the cards only need slugs to compute progress, so the
 * full manifest (sections, word counts) never crosses the boundary twice.
 */
export default function HomePage() {
  const groups = getTrackGroups();
  const manifest = getManifest();
  const { chapterCount, domainCount } = getStats();

  const progressChapters: ProgressChapter[] = manifest.map((c) => ({
    slug: c.slug,
    readingTime: c.readingTime,
  }));

  const continueChapters: ContinueChapter[] = manifest.map((c) => ({
    slug: c.slug,
    chapterNumber: c.chapterNumber,
    title: c.title,
    domainTitle: c.domain.title,
    track: c.track,
    readingTime: c.readingTime,
  }));

  const tracks: DomainProgressTrack[] = groups.map((group) => ({
    track: group.track,
    domains: group.domains.map((domain) => ({
      key: domain.domain.key,
      title: domain.domain.title,
      slugs: domain.chapters.map((c) => c.slug),
    })),
  }));

  const certTracks = tracks.filter((t) => t.track !== "core");
  const core = tracks.find((t) => t.track === "core");
  const chaptersIn = (track: DomainProgressTrack) =>
    track.domains.reduce((sum, d) => sum + d.slugs.length, 0);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-10">
      <AnimatedSection as="header" immediate>
        <p className="eyebrow">Claude Certified Architect</p>
        <h1 className="mt-3 text-fluid-2xl font-semibold tracking-display sm:text-fluid-3xl">
          Study the CCAR exam, chapter by chapter.
        </h1>
        <p className="mt-4 max-w-2xl text-fluid-base text-muted-foreground">
          {chapterCount} chapters across {domainCount} domains, with progress you can see and a
          reader built for long sessions.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <ContinueCta chapters={continueChapters} />
          <Button asChild variant="outline">
            <Link href="/tracks/foundation">
              <span className="size-1.5 rounded-full bg-foundation" aria-hidden="true" />
              Start Foundation
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/tracks/professional">
              <span className="size-1.5 rounded-full bg-professional" aria-hidden="true" />
              Start Professional
            </Link>
          </Button>
        </div>
      </AnimatedSection>

      {/* Above the fold, so it reveals on first paint rather than on scroll. */}
      <AnimatedSection immediate tight delay={0.06} className="mt-12 sm:mt-14">
        <DashboardMetrics chapters={progressChapters} />
      </AnimatedSection>

      <section aria-labelledby="tracks-heading" className="mt-12 sm:mt-14">
        <AnimatedSection as="header" tight>
          <h2 id="tracks-heading" className="text-base font-semibold tracking-display sm:text-lg">
            Tracks
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Two certification tracks, plus the orientation chapters that sit outside both.
          </p>
        </AnimatedSection>

        <AnimatedList className="mt-5 grid items-stretch gap-4 sm:grid-cols-2">
          {certTracks.map((track) => (
            <AnimatedItem key={track.track} className="h-full">
              <TrackCard
                track={track.track}
                domains={track.domains}
                chapterCount={chaptersIn(track)}
              />
            </AnimatedItem>
          ))}
        </AnimatedList>

        {core && (
          <AnimatedSection className="mt-4" tight>
            <TrackCard
              track={core.track}
              domains={core.domains}
              chapterCount={chaptersIn(core)}
              compact
            />
          </AnimatedSection>
        )}
      </section>

      <ContinueCard chapters={continueChapters} className="mt-12 sm:mt-14" />

      <section aria-labelledby="domains-heading" className="mt-12 sm:mt-14">
        <AnimatedSection as="header" tight>
          <h2 id="domains-heading" className="text-base font-semibold tracking-display sm:text-lg">
            Domain progress
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every domain in the syllabus, with how far through it you are.
          </p>
        </AnimatedSection>

        <DomainProgress tracks={tracks} className="mt-6" />
      </section>
    </main>
  );
}
