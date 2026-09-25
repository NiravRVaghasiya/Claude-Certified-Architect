"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PlayCircle } from "lucide-react";
import { useProgress } from "@/lib/progress";
import type { ChapterSummary } from "@/lib/types";
import { fadeUp } from "@/lib/motion";

export function ResumeCard({ manifest }: { manifest: ChapterSummary[] }) {
  const { hydrated, lastVisited, completed } = useProgress();
  if (!hydrated) return null;

  const target =
    manifest.find((c) => c.slug === lastVisited) ??
    manifest.find((c) => !completed.has(c.slug));

  if (!target || completed.size === manifest.length) return null;

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-8">
      <Link
        href={`/chapters/${target.slug}`}
        className="flex items-center gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-4 transition-colors hover:border-primary/50"
      >
        <PlayCircle className="h-8 w-8 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {lastVisited === target.slug ? "Continue reading" : "Pick up where you left off"}
          </p>
          <p className="font-medium">
            Chapter {target.chapterNumber} — {target.title}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
