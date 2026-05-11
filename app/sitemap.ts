import type { MetadataRoute } from "next";

const baseUrl = "https://clcocloud.kr";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/start`, lastModified: now, changeFrequency: "monthly", priority: 0.65 }
  ];
}
