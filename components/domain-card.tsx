"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ProgressRing } from "@/components/progress-ring";
import { useProgress } from "@/lib/progress";
import type { DomainGroup } from "@/lib/types";

export function DomainCard({ group }: { group: DomainGroup }) {
  const { hydrated, percentOf } = useProgress();
  const slugs = group.chapters.map((c) => c.slug);
  const percent = hydrated ? percentOf(slugs) : 0;

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Link
        href={`/tracks/${group.track}/${group.domain.key}`}
        className="group flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold leading-snug">{group.domain.title}</h3>
          <ProgressRing percent={percent} size={40} strokeWidth={4} />
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>{group.chapters.length} chapters</span>
          <span className="inline-flex items-center gap-1 font-medium text-foreground opacity-0 transition-opacity group-hover:opacity-100">
            View <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
