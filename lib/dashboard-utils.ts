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
  // Include all requests that have a valid model name
  const filtered = requests.filter((request) => request.requestedModel);

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
  if (points.length === 1) return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} L ${points[1].x.toFixed(2)} ${points[1].y.toFixed(2)}`;
  }

  // Horizontal cubic spline interpolation for a beautiful smooth premium curve
  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cp1x = p0.x + (p1.x - p0.x) / 3;
    const cp1y = p0.y;
    const cp2x = p0.x + 2 * (p1.x - p0.x) / 3;
    const cp2y = p1.y;
    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
  }
  return path;
}
