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

export interface MultiSeriesPoint {
  label: string;
  totalTokens: number;
  totalRequests: number;
  opusTokens: number;
  opusRequests: number;
  sonnetTokens: number;
  sonnetRequests: number;
  haikuTokens: number;
  haikuRequests: number;
  totalY: number;
  opusY: number;
  sonnetY: number;
  haikuY: number;
  x: number;
}

export function buildMultiSeriesUsage(requests: ApiKeyRecentRequest[] = []): MultiSeriesPoint[] {
  const daily = new Map<string, {
    totalTokens: number;
    totalRequests: number;
    opusTokens: number;
    opusRequests: number;
    sonnetTokens: number;
    sonnetRequests: number;
    haikuTokens: number;
    haikuRequests: number;
  }>();

  for (const request of requests) {
    const time = Date.parse(request.createdAt);
    if (!Number.isFinite(time)) continue;
    const label = new Date(time).toISOString().slice(0, 10);
    const current = daily.get(label) ?? {
      totalTokens: 0,
      totalRequests: 0,
      opusTokens: 0,
      opusRequests: 0,
      sonnetTokens: 0,
      sonnetRequests: 0,
      haikuTokens: 0,
      haikuRequests: 0,
    };

    const tokens = request.totalTokens ?? 0;
    const model = (request.requestedModel ?? "").toLowerCase();

    current.totalTokens += tokens;
    current.totalRequests += 1;

    if (model.includes("opus")) {
      current.opusTokens += tokens;
      current.opusRequests += 1;
    } else if (model.includes("haiku")) {
      current.haikuTokens += tokens;
      current.haikuRequests += 1;
    } else {
      current.sonnetTokens += tokens;
      current.sonnetRequests += 1;
    }

    daily.set(label, current);
  }

  const sorted = Array.from(daily.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([label, value]) => ({ label, ...value }));

  if (sorted.length === 0) return [];

  const maxTotalTokens = Math.max(...sorted.map((point) => point.totalTokens), 1);

  if (sorted.length === 1) {
    const only = sorted[0];
    return [{
      ...only,
      x: 50,
      totalY: 92 - (only.totalTokens / maxTotalTokens) * 74,
      opusY: 92 - (only.opusTokens / maxTotalTokens) * 74,
      sonnetY: 92 - (only.sonnetTokens / maxTotalTokens) * 74,
      haikuY: 92 - (only.haikuTokens / maxTotalTokens) * 74,
    }];
  }

  return sorted.map((point, index) => {
    const x = (index / (sorted.length - 1)) * 100;
    return {
      ...point,
      x,
      totalY: 92 - (point.totalTokens / maxTotalTokens) * 74,
      opusY: 92 - (point.opusTokens / maxTotalTokens) * 74,
      sonnetY: 92 - (point.sonnetTokens / maxTotalTokens) * 74,
      haikuY: 92 - (point.haikuTokens / maxTotalTokens) * 74,
    };
  });
}

export function buildSmoothPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const point = points[0];
    return `M -5.00 ${point.y.toFixed(2)} L 105.00 ${point.y.toFixed(2)}`;
  }

  const extended = [
    { x: -5, y: points[0].y },
    ...points,
    { x: 105, y: points[points.length - 1].y }
  ];

  let path = `M ${extended[0].x.toFixed(2)} ${extended[0].y.toFixed(2)}`;
  
  for (let i = 0; i < extended.length - 1; i++) {
    const p0 = extended[i];
    const p1 = extended[i + 1];
    
    const dx = (p1.x - p0.x) * 0.35;
    const cp1x = p0.x + dx;
    const cp1y = p0.y;
    const cp2x = p1.x - dx;
    const cp2y = p1.y;
    
    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
  }
  
  return path;
}

export function buildSmoothAreaPath(points: Array<{ x: number; y: number }>) {
  const linePath = buildSmoothPath(points);
  if (!linePath) return "";
  return `${linePath} L 105.00 100.00 L -5.00 100.00 Z`;
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

