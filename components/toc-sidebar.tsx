"use client";

import * as React from "react";
import { motion } from "framer-motion";
import type { SectionHeading } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TocSidebar({ sections }: { sections: SectionHeading[] }) {
  const [activeId, setActiveId] = React.useState<string | null>(sections[0]?.id ?? null);

  React.useEffect(() => {
    if (sections.length === 0) return;
    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  if (sections.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        On this page
      </p>
      <ul className="space-y-0.5 border-l border-border text-sm">
        {sections.map((section) => {
          const active = section.id === activeId;
          return (
            <li key={section.id} className="relative">
              {active && (
                <motion.span
                  layoutId="toc-indicator"
                  className="absolute -left-px top-0 h-full w-px bg-primary"
                  transition={{ duration: 0.2 }}
                />
              )}
              <a
                href={`#${section.id}`}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "block truncate py-1 pl-3 transition-colors",
                  section.level === 3 && "pl-6 text-[0.8rem]",
                  active ? "font-medium text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {section.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
