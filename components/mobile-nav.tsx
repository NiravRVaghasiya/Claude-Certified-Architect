"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NavTree } from "@/components/nav-tree";
import type { TrackGroup } from "@/lib/types";
import { easeOut } from "@/lib/motion";

export function MobileNav({ groups }: { groups: TrackGroup[] }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  React.useEffect(() => setOpen(false), [pathname]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open chapter navigation" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </DialogPrimitive.Trigger>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                className="fixed inset-y-0 left-0 z-50 flex w-[85vw] max-w-sm flex-col border-r border-border bg-card p-4"
                initial={{ x: shouldReduceMotion ? 0 : "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: shouldReduceMotion ? 0 : "-100%" }}
                transition={{ duration: shouldReduceMotion ? 0.01 : 0.28, ease: easeOut }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <DialogPrimitive.Title className="text-sm font-semibold">
                    Chapters
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="sr-only">
                    Browse tracks, domains, and chapters
                  </DialogPrimitive.Description>
                  <DialogPrimitive.Close asChild>
                    <Button variant="ghost" size="icon" aria-label="Close navigation">
                      <X className="h-4 w-4" />
                    </Button>
                  </DialogPrimitive.Close>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <NavTree groups={groups} onNavigate={() => setOpen(false)} />
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
