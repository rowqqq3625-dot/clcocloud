import type { ApiKeyRecentRequest } from "@/lib/keys/types";

export const DASHBOARD_REFRESH_INTERVAL_MS = 30_000;

export type RequestStatusTone = "success" | "client" | "server" | "neutral";

export function maskApiKey(prefix: string | null | undefined) {
  const safePrefix = prefix?.trim() || "rm_••••••••••ce";
  return `${safePrefix}••••••`;
}

export function getRequestStatusTone(statusCode: number): RequestStatusTone {
  if (statusCode >= 200 && statusCode < 300) return "success";
  if (statusCode >= 400 && statusCode < 500) return "client";
  if (statusCode >= 500) return "server";
  return "neutral";
}

export function formatRefreshMeta(fetchedAt: string | null | undefined) {
  if (!fetchedAt) return "대기 중";
  const elapsedMs = Date.now() - new Date(fetchedAt).getTime();
  if (Number.isNaN(elapsedMs) || elapsedMs < 60_000) return "less than a minute ago 갱신됨";
  const minutes = Math.max(1, Math.floor(elapsedMs / 60_000));
  return `${minutes} minutes ago 갱신됨`;
}

export function buildUsageSeries(requests: ApiKeyRecentRequest[] = []) {
  // Filter strictly Sonnet, Opus, and Haiku models
  const filtered = requests.filter((request) => {
    const m = request.requestedModel.toLowerCase();
    return (
      m.includes("sonnet") || m.includes("소넷") ||
      m.includes("opus") || m.includes("오푸스") ||
      m.includes("haiku") || m.includes("하이쿠")
    );
  });

  // Sort chronologically (oldest first)
  const sorted = [...filtered].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // If no requests, draw a baseline of 0 points across the axis
  if (sorted.length === 0) {
    return Array.from({ length: 12 }, (_, i) => ({
      label: `T-${12 - i}`,
      value: 0,
      x: (i / 11) * 100,
      y: 92,
    }));
  }

  // If exactly 1 request, draw two points to create a smooth slope
  if (sorted.length === 1) {
    const val = sorted[0].totalTokens;
    return [
      { label: "시작", value: 0, x: 0, y: 92 },
      { label: sorted[0].createdAt, value: val, x: 100, y: 18 },
    ];
  }

  const values = sorted.map((request) => request.totalTokens);
  const max = Math.max(...values, 1);

  return sorted.map((request, index) => {
    const value = request.totalTokens;
    return {
      label: request.createdAt,
      value,
      x: (index / (sorted.length - 1)) * 100,
      y: 92 - (value / max) * 74,
    };
  });
}

export function buildSvgPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
}
