import Link from "next/link";
import { ArrowRight, BookOpen, Layers, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackCard } from "@/components/track-card";
import { ResumeCard } from "@/components/resume-card";
import { Reveal, RevealGroup, RevealItem } from "@/components/reveal";
import { getManifest, getStats, getTrackGroups } from "@/lib/content";

export default function HomePage() {
  const groups = getTrackGroups();
  const manifest = getManifest();
  const stats = getStats();

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <section className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground">
          Claude Certified Architect
        </span>
        <h1 className="mt-6 text-fluid-3xl font-bold tracking-tight">
          Study the CCAR certification, chapter by chapter.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-fluid-base text-muted-foreground">
          An interactive rebuild of the CCAR study notes — {stats.chapterCount} chapters across the
          Foundation and Professional tracks, with search, progress tracking, and a reader built for
          focus.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/tracks/foundation">
              Start Foundation (CCAR-F) <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/tracks/professional">Start Professional (CCAR-P)</Link>
          </Button>
        </div>

        <dl className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-4 text-center" id="progress">
          {[
            { icon: BookOpen, label: "Chapters", value: stats.chapterCount },
            { icon: Layers, label: "Domains", value: stats.domainCount },
            { icon: Route, label: "Tracks", value: stats.trackCount },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-4">
              <Icon className="mx-auto h-5 w-5 text-primary" aria-hidden="true" />
              <dd className="mt-2 text-fluid-lg font-bold tabular-nums">{value}</dd>
              <dt className="text-xs text-muted-foreground">{label}</dt>
            </div>
          ))}
        </dl>
      </section>

      <div className="mx-auto mt-14 max-w-3xl">
        <ResumeCard manifest={manifest} />
      </div>

      <Reveal as="section" className="mt-4">
        <RevealGroup className="grid gap-5 sm:grid-cols-2">
          {groups
            .filter((g) => g.track !== "core")
            .map((group) => (
              <RevealItem key={group.track}>
                <TrackCard group={group} />
              </RevealItem>
            ))}
        </RevealGroup>
      </Reveal>

      {groups.find((g) => g.track === "core") && (
        <Reveal as="section" className="mt-8">
          <TrackCard group={groups.find((g) => g.track === "core")!} />
        </Reveal>
      )}
    </main>
  );
}
