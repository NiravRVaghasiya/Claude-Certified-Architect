import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ProgressProvider } from "@/lib/progress";
import { SiteHeader } from "@/components/site-header";
import { SiteSidebar } from "@/components/site-sidebar";
import { getStats, getTrackGroups } from "@/lib/content";
import "./globals.css";

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
    { media: "(prefers-color-scheme: light)", color: "#faf9fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1117" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const groups = getTrackGroups();
  const { chapterCount } = getStats();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ProgressProvider>
            <a href="#main-content" className="skip-link">
              Skip to content
            </a>
            <SiteHeader groups={groups} chapterCount={chapterCount} />
            <div className="mx-auto flex w-full max-w-[1440px]">
              <SiteSidebar groups={groups} />
              <div id="main-content" className="min-w-0 flex-1">
                {children}
              </div>
            </div>
          </ProgressProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
