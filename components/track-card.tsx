"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ProgressRing } from "@/components/progress-ring";
import { useProgress } from "@/lib/progress";
import { TRACK_DESCRIPTIONS, TRACK_LABELS, type TrackGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

const TRACK_ACCENT: Record<string, string> = {
  core: "border-border hover:border-primary/40",
  foundation: "border-foundation/30 hover:border-foundation",
  professional: "border-professional/30 hover:border-professional",
};

const TRACK_RING: Record<string, string> = {
  core: "text-primary",
  foundation: "text-foundation",
  professional: "text-professional",
};

export function TrackCard({ group }: { group: TrackGroup }) {
  const { hydrated, percentOf } = useProgress();
  const slugs = group.domains.flatMap((d) => d.chapters.map((c) => c.slug));
  const percent = hydrated ? percentOf(slugs) : 0;

  return (
    <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.99 }}>
      <Link
        href={`/tracks/${group.track}`}
        className={cn(
          "group block rounded-2xl border-2 bg-card p-6 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          TRACK_ACCENT[group.track]
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-fluid-lg font-semibold">{TRACK_LABELS[group.track]}</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {TRACK_DESCRIPTIONS[group.track]}
            </p>
          </div>
          <ProgressRing percent={percent} trackColorClassName={TRACK_RING[group.track]} />
        </div>
        <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {group.chapterCount} chapters · {group.domains.length} domains
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-foreground opacity-0 transition-opacity group-hover:opacity-100">
            Explore <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
