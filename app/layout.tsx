import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { MotionProvider } from "@/components/animations/motion-provider";
import { ChapterSidebar } from "@/components/navigation/chapter-sidebar";
import { SiteHeader } from "@/components/navigation/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { ProgressProvider } from "@/lib/progress";
import { getStats, getTrackGroups } from "@/lib/content";
import "./globals.css";
// chapter-prose.css / chapter-blocks.css are imported by the chapter route itself —
// they are ~70 kB of CSS that only the reader needs, and a page-level import
// still lands after this layout stylesheet, so their overrides keep winning.

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ccar-study.vercel.app"),
  title: {
    default: "Claude Certified Architect — Study Guide",
    template: "%s · CCAR Study Guide",
  },
  description:
    "An interactive study guide for the Claude Certified Architect (CCAR) certification: 70 chapters across the Foundation and Professional tracks.",
  openGraph: {
    title: "Claude Certified Architect — Study Guide",
    description:
      "An interactive study guide for the Claude Certified Architect (CCAR) certification.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1115" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const groups = getTrackGroups();
  const { chapterCount } = getStats();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} page-wash font-sans antialiased`}
      >
        {/* Reveal animations render their hidden state into the SSR markup, so
            without JS those sections would stay at opacity 0. Undo that. */}
        <noscript>
          <style>{`[data-animated]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <MotionProvider>
            <ProgressProvider>
              <a href="#main-content" className="skip-link">
                Skip to content
              </a>
              <SiteHeader groups={groups} chapterCount={chapterCount} />
              <div className="mx-auto flex w-full max-w-shell pt-header">
                <aside
                  aria-label="Chapter navigation"
                  className="sticky top-header hidden h-[calc(100dvh-var(--header-h))] w-[17.5rem] shrink-0 border-r border-border lg:block"
                >
                  <ChapterSidebar groups={groups} />
                </aside>
                {/* tabIndex makes the skip link actually move focus here in every browser. */}
                <div id="main-content" tabIndex={-1} className="min-w-0 flex-1 focus-visible:outline-none">
                  {children}
                </div>
              </div>
            </ProgressProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
