"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { ChapterSidebar } from "@/components/navigation/chapter-sidebar";
import { LogoMark } from "@/components/navigation/logo";
import { Button } from "@/components/ui/button";
import { drawerVariants, transitions } from "@/lib/motion";
import { slugsOf } from "@/lib/nav";
import { useProgress } from "@/lib/progress";
import { useMotionSafe } from "@/lib/use-motion";
import type { TrackGroup } from "@/lib/types";

/**
 * Chapter navigation on tablet/mobile: a left drawer that slides in over a
 * fading backdrop and closes on navigation. Radix owns focus trapping, the
 * escape key, and scroll locking; framer owns the movement.
 */
export function MobileNavigation({ groups }: { groups: TrackGroup[] }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const motionSafe = useMotionSafe();
  const { hydrated, percentOf } = useProgress();

  const allSlugs = React.useMemo(() => slugsOf(groups), [groups]);
  const percent = hydrated ? percentOf(allSlugs) : 0;

  React.useEffect(() => setOpen(false), [pathname]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Open chapter navigation"
          className="text-muted-foreground hover:text-foreground lg:hidden"
        >
          <Menu className="size-[1.125rem]" />
        </Button>
      </DialogPrimitive.Trigger>

      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-background/70 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                // Same L2 window as the panel, so backdrop and drawer read as one
                // surface arriving rather than two.
                transition={transitions.base}
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                className="fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-[20rem] flex-col border-r border-border bg-card shadow-lg"
                variants={drawerVariants}
                initial={motionSafe ? "hidden" : false}
                animate="visible"
                exit="exit"
              >
                <div className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
                  <LogoMark className="text-foreground" />
                  <DialogPrimitive.Title className="text-sm font-semibold tracking-display">
                    Chapters
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="sr-only">
                    Browse tracks, domains, and chapters
                  </DialogPrimitive.Description>
                  <span className="ml-auto font-mono text-2xs tabular text-muted-foreground">
                    {percent}%
                  </span>
                  <DialogPrimitive.Close asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Close navigation"
                      className="text-muted-foreground"
                    >
                      <X className="size-4" />
                    </Button>
                  </DialogPrimitive.Close>
                </div>

                {/* The panel carries the eye in; the rail's track sections then
                    cascade once (L2, ~40ms apart, inside 300ms). The cascade is
                    declared by the rail's own nav, so it runs on mount only and
                    does not replay when progress changes. Exits are uniform — the
                    panel slides out and nothing staggers on the way. */}
                <div className="min-h-0 flex-1">
                  <ChapterSidebar
                    groups={groups}
                    instanceId="drawer"
                    cascade
                    onNavigate={() => setOpen(false)}
                  />
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
