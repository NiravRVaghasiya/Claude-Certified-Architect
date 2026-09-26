"use client";

import { Check, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CardLink } from "@/components/ui/card";
import { chapterDek } from "@/lib/dek";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

/** The chapter fields a card renders — a narrow slice of `ChapterSummary`. */
export interface ChapterCardChapter {
  slug: string;
  chapterNumber: number;
  title: string;
  dek: string | null;
  readingTime: number;
}

export interface ChapterCardProps {
  chapter: ChapterCardChapter;
  className?: string;
}

export function ChapterCard({ chapter, className }: ChapterCardProps) {
  const { hydrated, isComplete } = useProgress();
  const done = hydrated && isComplete(chapter.slug);

  return (
    <CardLink
      href={`/chapters/${chapter.slug}`}
      className={cn("flex h-full flex-col p-5", done && "border-success/30", className)}
    >
      <div className="flex min-h-[1.25rem] items-center justify-between gap-2">
        <span className="eyebrow">Chapter {chapter.chapterNumber}</span>
        {done && (
          <Badge variant="success" size="sm" mono>
            <Check aria-hidden="true" />
            Done
          </Badge>
        )}
      </div>

      <h3 className="mt-2.5 text-[0.9375rem] font-semibold leading-snug tracking-display">
        {chapter.title}
      </h3>
      {chapterDek(chapter.dek) && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{chapterDek(chapter.dek)}</p>
      )}

      <p className="eyebrow mt-auto flex items-center gap-1.5 pt-5">
        <Clock className="size-3 shrink-0" aria-hidden="true" />
        {chapter.readingTime} min read
      </p>
    </CardLink>
  );
}
