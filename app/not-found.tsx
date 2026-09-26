import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStats } from "@/lib/content";

/**
 * 404. Deliberately unanimated — it renders when something already went wrong,
 * so it stays a plain server component with no motion payload.
 */
export default function NotFound() {
  const { chapterCount } = getStats();

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center px-4 py-12 sm:px-6 lg:px-10">
      <p className="eyebrow">404 · Not found</p>
      <h1 className="mt-3 text-fluid-2xl font-semibold tracking-display">
        We couldn&apos;t find that page.
      </h1>
      <p className="mt-4 text-fluid-base text-muted-foreground">
        The chapter may have been renamed, or the link is incomplete. Search all {chapterCount}{" "}
        chapters, or head back to your dashboard.
      </p>
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <Button asChild>
          <Link href="/">
            <ArrowLeft aria-hidden="true" />
            Back to dashboard
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/search">
            <Search aria-hidden="true" />
            Search chapters
          </Link>
        </Button>
      </div>
    </main>
  );
}
