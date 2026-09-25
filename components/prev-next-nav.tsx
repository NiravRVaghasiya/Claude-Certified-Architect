import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ChapterSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PrevNextNav({
  prev,
  next,
}: {
  prev: ChapterSummary | null;
  next: ChapterSummary | null;
}) {
  if (!prev && !next) return null;
  return (
    <nav aria-label="Chapter navigation" className="mt-10 grid gap-3 border-t border-border pt-8 sm:grid-cols-2">
      {prev ? (
        <Link
          href={`/chapters/${prev.slug}`}
          className="group flex flex-col rounded-2xl border border-border p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Previous
          </span>
          <span className="mt-1 font-medium">
            {prev.chapterNumber}. {prev.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={`/chapters/${next.slug}`}
          className={cn(
            "group flex flex-col rounded-2xl border border-border p-4 text-right transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "sm:col-start-2"
          )}
        >
          <span className="inline-flex items-center justify-end gap-1 text-xs text-muted-foreground">
            Next <ArrowRight className="h-3.5 w-3.5" />
          </span>
          <span className="mt-1 font-medium">
            {next.chapterNumber}. {next.title}
          </span>
        </Link>
      ) : null}
    </nav>
  );
}
