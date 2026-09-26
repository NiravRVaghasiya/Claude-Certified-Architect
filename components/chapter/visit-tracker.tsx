"use client";

import * as React from "react";
import { useProgress } from "@/lib/progress";

/** Records the current chapter as "last visited" for the homepage resume card. */
export function VisitTracker({ slug }: { slug: string }) {
  const { setLastVisited } = useProgress();

  React.useEffect(() => {
    setLastVisited(slug);
    // `setLastVisited` is stable per provider; re-running on identity changes
    // would rewrite storage on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return null;
}
