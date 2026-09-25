"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import type { TrackGroup } from "@/lib/types";
import { TRACK_LABELS } from "@/lib/types";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

export function NavTree({ groups, onNavigate }: { groups: TrackGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { isComplete } = useProgress();

  return (
    <nav aria-label="Chapters" className="space-y-1">
      {groups.map((group) => {
        const trackHasActive = pathname?.startsWith(`/tracks/${group.track}`);
        return (
          <details key={group.track} open={Boolean(trackHasActive)} className="group/track">
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-2 py-1.5 text-sm font-semibold text-foreground hover:bg-muted">
              <Link href={`/tracks/${group.track}`} onClick={onNavigate} className="hover:underline">
                {TRACK_LABELS[group.track]}
              </Link>
              <span className="text-xs text-muted-foreground">{group.chapterCount}</span>
            </summary>
            <div className="ml-2 border-l border-border pl-2">
              {group.domains.map((domainGroup) => {
                const domainHref = `/tracks/${group.track}/${domainGroup.domain.key}`;
                const domainHasActive = pathname === domainHref;
                const domainHasActiveChapter = domainGroup.chapters.some(
                  (c) => pathname === `/chapters/${c.slug}`
                );
                return (
                  <details
                    key={domainGroup.domain.key}
                    open={domainHasActive || domainHasActiveChapter}
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                      <Link href={domainHref} onClick={onNavigate} className="hover:underline">
                        {domainGroup.domain.title}
                      </Link>
                    </summary>
                    <ul className="ml-2 space-y-0.5 border-l border-border pl-2">
                      {domainGroup.chapters.map((chapter) => {
                        const href = `/chapters/${chapter.slug}`;
                        const active = pathname === href;
                        const done = isComplete(chapter.slug);
                        return (
                          <li key={chapter.slug}>
                            <Link
                              href={href}
                              onClick={onNavigate}
                              aria-current={active ? "page" : undefined}
                              className={cn(
                                "flex items-center gap-2 rounded-lg px-2 py-1 text-sm transition-colors",
                                active
                                  ? "bg-primary/10 font-medium text-primary"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              )}
                            >
                              <span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground/70">
                                {chapter.chapterNumber}
                              </span>
                              <span className="flex-1 truncate">{chapter.title}</span>
                              {done && (
                                <Check className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                );
              })}
            </div>
          </details>
        );
      })}
    </nav>
  );
}
