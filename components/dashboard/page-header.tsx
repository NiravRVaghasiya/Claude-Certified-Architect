import * as React from "react";
import { AnimatedSection } from "@/components/animations/animated-section";
import { Breadcrumbs, type Crumb } from "@/components/navigation/breadcrumbs";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  /** Mono label above the title — "Track", "Domain", "404". */
  eyebrow: string;
  title: string;
  dek?: string | null;
  /** One line of counts below the dek — "34 chapters · 6 domains". */
  meta?: string | null;
  breadcrumbs?: Crumb[];
  /** `bg-*` class for the hue dot beside the eyebrow (carries track identity). */
  dotClassName?: string;
  /** Right-aligned controls on the title row. */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * The one page-title block: breadcrumbs → eyebrow → h1 → dek → meta.
 *
 * Stays a server component so route pages can feed it content read from disk;
 * the reveal comes from `AnimatedSection`, which is the client boundary.
 */
export function PageHeader({
  eyebrow,
  title,
  dek,
  meta,
  breadcrumbs,
  dotClassName,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <AnimatedSection as="header" immediate className={cn("min-w-0", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} className="mb-5" />
      )}

      <div className="flex items-center gap-2">
        {dotClassName && (
          <span className={cn("size-1.5 shrink-0 rounded-full", dotClassName)} aria-hidden="true" />
        )}
        <p className="eyebrow">{eyebrow}</p>
      </div>

      <div className="mt-2.5 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <h1 className="text-fluid-2xl font-semibold tracking-display">{title}</h1>
        {actions}
      </div>

      {dek && <p className="mt-3 max-w-prose text-fluid-base text-muted-foreground">{dek}</p>}
      {meta && <p className="eyebrow mt-3">{meta}</p>}
    </AnimatedSection>
  );
}
