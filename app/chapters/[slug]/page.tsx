import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ChapterBody } from "@/components/chapter-body";
import { MarkCompleteButton } from "@/components/mark-complete-button";
import { PrevNextNav } from "@/components/prev-next-nav";
import { ReadingProgressBar } from "@/components/reading-progress-bar";
import { TocSidebar } from "@/components/toc-sidebar";
import { VisitTracker } from "@/components/visit-tracker";
import { getAdjacentChapters, getAllSlugs, getChapterBySlug } from "@/lib/content";
import { TRACK_LABELS } from "@/lib/types";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  let chapter;
  try {
    chapter = getChapterBySlug(params.slug);
  } catch {
    return {};
  }
  const description = chapter.dek ?? `Chapter ${chapter.chapterNumber} of the CCAR study guide.`;
  return {
    title: `${chapter.chapterNumber}. ${chapter.title}`,
    description,
    openGraph: { title: chapter.title, description, type: "article" },
  };
}

export default function ChapterPage({ params }: { params: { slug: string } }) {
  let chapter;
  try {
    chapter = getChapterBySlug(params.slug);
  } catch {
    notFound();
  }
  const { prev, next } = getAdjacentChapters(chapter.chapterNumber);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <VisitTracker slug={chapter.slug} />
      <ReadingProgressBar />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: TRACK_LABELS[chapter.track], href: `/tracks/${chapter.track}` },
          { label: chapter.domain.title, href: `/tracks/${chapter.track}/${chapter.domain.key}` },
          { label: `Ch. ${chapter.chapterNumber}` },
        ]}
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_240px]">
        <article>
          <header>
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              Chapter {chapter.chapterNumber}
            </span>
            <h1 className="mt-1 text-fluid-2xl font-bold tracking-tight">{chapter.title}</h1>
            {chapter.dek && <p className="mt-3 text-fluid-base text-muted-foreground">{chapter.dek}</p>}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> {chapter.readingTime} min read
              </span>
              <MarkCompleteButton slug={chapter.slug} />
            </div>
          </header>

          <div className="mt-8">
            <ChapterBody html={chapter.bodyHtml} />
          </div>

          <PrevNextNav prev={prev} next={next} />
        </article>

        <div className="hidden lg:block">
          <TocSidebar sections={chapter.sections} />
        </div>
      </div>
    </main>
  );
}
