import type { ApiKeyRecentRequest } from "@/lib/keys/types";

export const DASHBOARD_REFRESH_INTERVAL_MS = 30_000;

export type RequestStatusTone = "success" | "client" | "server" | "neutral";

export function maskApiKey(prefix: string | null | undefined) {
  const safePrefix = prefix?.trim() || "sk-hidden";
  return `${safePrefix}•••••`;
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
  if (Number.isNaN(elapsedMs) || elapsedMs < 60_000) return "방금 갱신됨";
  const minutes = Math.max(1, Math.floor(elapsedMs / 60_000));
  return `${minutes}분 전 갱신됨`;
}

export function buildUsageSeries(requests: ApiKeyRecentRequest[] = []) {
  const daily = new Map<string, { tokens: number; requests: number }>();

  for (const request of requests) {
    const time = Date.parse(request.createdAt);
    if (!Number.isFinite(time)) continue;
    const label = new Date(time).toISOString().slice(0, 10);
    const current = daily.get(label) ?? { tokens: 0, requests: 0 };
    current.tokens += request.totalTokens;
    current.requests += 1;
    daily.set(label, current);
  }

  const sorted = Array.from(daily.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([label, value]) => ({ label, ...value }));

  if (sorted.length === 0) return [];

  if (sorted.length === 1) {
    const only = sorted[0];
    return [{ label: only.label, value: only.tokens, requests: only.requests, x: 50, y: 28 }];
  }

  const max = Math.max(...sorted.map((point) => point.tokens), 1);
  return sorted.map((point, index) => ({
    label: point.label,
    value: point.tokens,
    requests: point.requests,
    x: (index / (sorted.length - 1)) * 100,
    y: 92 - (point.tokens / max) * 74,
  }));
}

export function buildSvgPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const point = points[0];
    return `M ${Math.max(0, point.x - 18).toFixed(2)} ${point.y.toFixed(2)} L ${Math.min(100, point.x + 18).toFixed(2)} ${point.y.toFixed(2)}`;
  }
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
}
