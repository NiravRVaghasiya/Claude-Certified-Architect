"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Clock } from "lucide-react";
import { useProgress } from "@/lib/progress";
import type { ChapterSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ChapterCard({ chapter }: { chapter: ChapterSummary }) {
  const { hydrated, isComplete } = useProgress();
  const done = hydrated && isComplete(chapter.slug);

  return (
    <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.99 }}>
      <Link
        href={`/chapters/${chapter.slug}`}
        className={cn(
          "group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          done && "border-success/30"
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Chapter {chapter.chapterNumber}
          </span>
          {done && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
              <Check className="h-3 w-3" /> Done
            </span>
          )}
        </div>
        <h3 className="mt-2 font-semibold leading-snug">{chapter.title}</h3>
        {chapter.dek && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{chapter.dek}</p>
        )}
        <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {chapter.readingTime} min read
        </div>
      </Link>
    </motion.div>
  );
}
