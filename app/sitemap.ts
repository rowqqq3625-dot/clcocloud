import type { MetadataRoute } from "next";

const baseUrl = "https://clcocloud.kr";

const docsPaths = [
  "/docs",
  "/docs/quickstart",
  "/docs/api-key",
  "/docs/usage",
  "/docs/installation",
  "/docs/environment-variables",
  "/docs/agent-integration",
  "/docs/clients/cursor",
  "/docs/clients/openclaw",
  "/docs/clients/vscode",
  "/docs/clients/opencode",
  "/docs/clients/n8n",
  "/docs/clients/hermes",
  "/docs/usage-monitoring",
  "/docs/pricing-plans",
  "/docs/model-pricing",
  "/docs/error-codes",
  "/docs/troubleshooting",
  "/docs/faq",
  "/docs/terms",
  "/docs/support"
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/start`, lastModified: now, changeFrequency: "monthly", priority: 0.65 },
    ...docsPaths.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "/docs" ? 0.85 : 0.7
    }))
  ];
}
