"use client";

import * as React from "react";
import { CalendarCheck, Check, Circle, Clock, type LucideIcon } from "lucide-react";
import { AnimatedNumber } from "@/components/animations/animated-number";
import { ProgressBar } from "@/components/progress/progress-bar";
import { ProgressRing } from "@/components/progress/progress-ring";
import { Card } from "@/components/ui/card";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

/** The only chapter fields any progress readout needs. Keeps the client payload small. */
export interface ProgressChapter {
  slug: string;
  readingTime: number;
}

/**
 * Minutes left is a soft estimate, so it reads as hours past two hours — "12h"
 * is more useful than "703m", and it keeps the tile to a single count-up.
 */
function formatMinutes(minutes: number): { value: number; suffix: string } {
  return minutes >= 120
    ? { value: Math.round(minutes / 60), suffix: "h" }
    : { value: minutes, suffix: "m" };
}

function remainingMinutes(chapters: ProgressChapter[], completed: Set<string>): number {
  return chapters.reduce((sum, c) => (completed.has(c.slug) ? sum : sum + c.readingTime), 0);
}

interface MetricProps {
  label: string;
  icon: LucideIcon;
  /** `null` renders a dash — used before hydration and for an empty streak. */
  value: number | null;
  suffix?: string;
  delay?: number;
}

/**
 * One metric tile. The value slot keeps a fixed minimum width so the real number
 * arriving after hydration never nudges the label beside it.
 */
function Metric({ label, icon: Icon, value, suffix = "", delay = 0 }: MetricProps) {
  return (
    <div>
      <dt className="eyebrow flex items-center gap-1.5">
        <Icon className="size-3 shrink-0" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1.5 font-mono text-fluid-lg font-semibold tabular tracking-display">
        {value === null ? (
          <span className="inline-block min-w-[2.5ch] text-muted-foreground">—</span>
        ) : (
          <AnimatedNumber
            value={value}
            suffix={suffix}
            delay={delay}
            className="inline-block min-w-[2.5ch]"
          />
        )}
      </dd>
    </div>
  );
}

/**
 * The home page's `#progress` panel — the header links to this anchor, so the
 * `id` is part of the app's contract.
 *
 * Every number is derived from localStorage, so the server renders zeros and the
 * real values count up once `hydrated` flips. Widths are reserved either way.
 */
export function DashboardMetrics({ chapters }: { chapters: ProgressChapter[] }) {
  const { hydrated, completed, countOf, percentOf, streak } = useProgress();

  const slugs = React.useMemo(() => chapters.map((c) => c.slug), [chapters]);
  const total = slugs.length;
  const done = hydrated ? countOf(slugs) : 0;
  const percent = hydrated ? percentOf(slugs) : 0;
  const left = formatMinutes(hydrated ? remainingMinutes(chapters, completed) : 0);

  return (
    <section id="progress" aria-labelledby="progress-heading">
      <h2 id="progress-heading" className="text-base font-semibold tracking-display sm:text-lg">
        Your progress
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Tracked on this device — nothing leaves your browser.
      </p>

      <Card className="mt-5 p-5 sm:p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
          <div className="relative inline-flex shrink-0 self-start sm:self-auto">
            <ProgressRing
              percent={percent}
              size={112}
              strokeWidth={7}
              showValue={false}
              label={`Overall progress: ${done} of ${total} chapters complete`}
            />
            <span
              className="absolute inset-0 grid place-items-center font-mono text-fluid-lg font-semibold tabular tracking-display"
              aria-hidden="true"
            >
              <AnimatedNumber value={percent} suffix="%" />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-fluid-lg font-semibold tracking-display">
              <AnimatedNumber value={done} className="inline-block min-w-[2ch]" />
              <span className="font-normal text-muted-foreground">
                {" "}
                of {total} chapters complete
              </span>
            </p>
            <ProgressBar
              percent={percent}
              height={6}
              className="mt-4"
              label={`Overall progress: ${percent}%`}
            />

            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border pt-6 sm:grid-cols-4">
              <Metric label="Complete" icon={Check} value={hydrated ? done : null} delay={0.05} />
              <Metric
                label="Remaining"
                icon={Circle}
                value={hydrated ? total - done : null}
                delay={0.1}
              />
              <Metric
                label="Reading left"
                icon={Clock}
                value={hydrated ? left.value : null}
                suffix={left.suffix}
                delay={0.15}
              />
              <Metric
                label="Day streak"
                icon={CalendarCheck}
                value={hydrated && streak > 0 ? streak : null}
                delay={0.2}
              />
            </dl>
          </div>
        </div>
      </Card>
    </section>
  );
}

export interface ProgressSummaryProps {
  chapters: ProgressChapter[];
  /** What the numbers describe — "Foundation track", "Context Management". */
  label: string;
  /** `text-*` class for the ring stroke. */
  colorClassName?: string;
  /** `bg-*` class for the bar fill. */
  fillClassName?: string;
  className?: string;
}

/**
 * Compact ring + bar + count, shared by the track and domain pages so a subset
 * of chapters reports progress exactly the way the dashboard does.
 */
export function ProgressSummary({
  chapters,
  label,
  colorClassName,
  fillClassName,
  className,
}: ProgressSummaryProps) {
  const { hydrated, completed, countOf, percentOf } = useProgress();

  const slugs = React.useMemo(() => chapters.map((c) => c.slug), [chapters]);
  const total = slugs.length;
  const done = hydrated ? countOf(slugs) : 0;
  const percent = hydrated ? percentOf(slugs) : 0;
  const left = formatMinutes(hydrated ? remainingMinutes(chapters, completed) : 0);

  return (
    <Card className={cn("flex items-center gap-5 p-5", className)}>
      <div className="relative inline-flex shrink-0">
        <ProgressRing
          percent={percent}
          size={64}
          strokeWidth={5}
          showValue={false}
          colorClassName={colorClassName}
          label={`${label} progress: ${done} of ${total} chapters complete`}
        />
        <span
          className="absolute inset-0 grid place-items-center font-mono text-xs font-semibold tabular"
          aria-hidden="true"
        >
          <AnimatedNumber value={percent} suffix="%" />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          <AnimatedNumber value={done} className="inline-block min-w-[2ch]" />
          <span className="font-normal text-muted-foreground"> of {total} complete</span>
        </p>
        <ProgressBar
          percent={percent}
          height={4}
          className="mt-2.5"
          fillClassName={fillClassName}
          label={`${label} progress: ${percent}%`}
        />
      </div>

      <div className="hidden shrink-0 text-right sm:block">
        <p className="eyebrow">Reading left</p>
        <p className="mt-1 font-mono text-sm font-semibold tabular">
          {hydrated ? (
            <AnimatedNumber value={left.value} suffix={left.suffix} />
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </p>
      </div>
    </Card>
  );
}
