"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { MobileNav } from "@/components/mobile-nav";
import { CommandPalette } from "@/components/command-palette";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProgressRing } from "@/components/progress-ring";
import { useProgress } from "@/lib/progress";
import type { TrackGroup } from "@/lib/types";

export function SiteHeader({ groups, chapterCount }: { groups: TrackGroup[]; chapterCount: number }) {
  const { hydrated, percentOf } = useProgress();
  const allSlugs = groups.flatMap((g) => g.domains.flatMap((d) => d.chapters.map((c) => c.slug)));
  const overallPercent = hydrated ? percentOf(allSlugs) : 0;

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
      <MobileNav groups={groups} />
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <GraduationCap className="h-5 w-5 text-primary" aria-hidden="true" />
        <span className="hidden sm:inline">CCAR Study Guide</span>
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <CommandPalette />
        <ThemeToggle />
        <Link href="/#progress" aria-label={`Overall progress: ${overallPercent}%`}>
          <ProgressRing percent={overallPercent} size={36} strokeWidth={3.5} />
        </Link>
      </div>
      <span className="sr-only">{chapterCount} chapters</span>
    </header>
  );
}
