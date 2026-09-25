import type { MetadataRoute } from "next";
import { getManifest, getTrackGroups } from "@/lib/content";

const BASE_URL = "https://ccar-study.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/search`, changeFrequency: "monthly", priority: 0.3 },
  ];

  const trackRoutes: MetadataRoute.Sitemap = getTrackGroups().flatMap((group) => [
    { url: `${BASE_URL}/tracks/${group.track}`, changeFrequency: "weekly" as const, priority: 0.7 },
    ...group.domains.map((domain) => ({
      url: `${BASE_URL}/tracks/${group.track}/${domain.domain.key}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ]);

  const chapterRoutes: MetadataRoute.Sitemap = getManifest().map((chapter) => ({
    url: `${BASE_URL}/chapters/${chapter.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...trackRoutes, ...chapterRoutes];
}
