"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

export function MarkCompleteButton({ slug }: { slug: string }) {
  const { hydrated, isComplete, toggleComplete } = useProgress();
  const done = hydrated && isComplete(slug);

  return (
    <Button
      variant={done ? "default" : "outline"}
      size="sm"
      onClick={() => toggleComplete(slug)}
      className={cn(done && "bg-success text-white hover:bg-success/90")}
      aria-pressed={done}
    >
      <Check className="h-4 w-4" />
      {done ? "Completed" : "Mark complete"}
    </Button>
  );
}
