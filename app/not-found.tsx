import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">404</p>
      <h1 className="mt-2 text-fluid-2xl font-bold tracking-tight">Chapter not found</h1>
      <p className="mt-3 text-muted-foreground">
        This page doesn&apos;t exist, or the chapter moved. Try searching or heading back home.
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link href="/">Back to home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/search">Search chapters</Link>
        </Button>
      </div>
    </main>
  );
}
