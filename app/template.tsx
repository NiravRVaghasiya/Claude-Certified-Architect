import { AnimatedPage } from "@/components/animations/animated-page";

/**
 * Next re-mounts `template.tsx` on every navigation, which gives each route a
 * fresh enter transition (see AnimatedPage).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <AnimatedPage>{children}</AnimatedPage>;
}
