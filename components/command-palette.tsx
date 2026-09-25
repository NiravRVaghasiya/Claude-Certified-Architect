"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FileText, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSearchIndex } from "@/lib/search";
import { Button } from "@/components/ui/button";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const router = useRouter();
  const { fuse, entries, load } = useSearchIndex();
  const shouldReduceMotion = useReducedMotion();

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    if (open) load();
  }, [open, load]);

  const results = React.useMemo(() => {
    if (!fuse) return [];
    if (!query.trim()) return entries.slice(0, 8);
    return fuse.search(query, { limit: 20 }).map((r) => r.item);
  }, [fuse, entries, query]);

  function go(slug: string) {
    setOpen(false);
    setQuery("");
    router.push(`/chapters/${slug}`);
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="hidden items-center gap-2 text-muted-foreground sm:inline-flex"
          aria-label="Open search"
        >
          <Search className="h-4 w-4" />
          <span>Search</span>
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
            ⌘K
          </kbd>
        </Button>
      </DialogPrimitive.Trigger>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open search"
        className="sm:hidden"
        onClick={() => setOpen(true)}
      >
        <Search className="h-5 w-5" />
      </Button>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                className="fixed left-1/2 top-24 z-50 w-full max-w-xl -translate-x-1/2 px-4"
                initial={{ opacity: 0, scale: 0.96, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -8 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0.01 }
                    : { type: "spring", stiffness: 380, damping: 30 }
                }
              >
                <DialogPrimitive.Title className="sr-only">Search chapters</DialogPrimitive.Title>
                <Command
                  shouldFilter={false}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
                >
                  <div className="flex items-center gap-2 border-b border-border px-4">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Command.Input
                      autoFocus
                      value={query}
                      onValueChange={setQuery}
                      placeholder="Search chapters, sections, topics…"
                      className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                  <Command.List className="max-h-[60vh] overflow-y-auto p-2">
                    <Command.Empty className="py-10 text-center text-sm text-muted-foreground">
                      No chapters found.
                    </Command.Empty>
                    {results.map((entry) => (
                      <Command.Item
                        key={entry.slug}
                        value={entry.slug}
                        onSelect={() => go(entry.slug)}
                        className="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 text-sm data-[selected=true]:bg-muted"
                      >
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="flex flex-col">
                          <span className="font-medium">
                            Ch. {entry.chapterNumber} · {entry.title}
                          </span>
                          <span className="text-xs text-muted-foreground">{entry.domain}</span>
                        </span>
                      </Command.Item>
                    ))}
                  </Command.List>
                </Command>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
