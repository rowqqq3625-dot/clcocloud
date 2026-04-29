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
  // 최근 요청의 토큰량만 사용해 클라이언트 전용 차트 데이터를 만든다.
  const source = requests.length > 0 ? requests.slice(0, 12).reverse() : [];
  const fallback = [18, 31, 24, 46, 39, 62, 54, 72, 61, 79, 68, 86];
  const values = source.length > 1 ? source.map((request) => request.totalTokens) : fallback;
  const max = Math.max(...values, 1);

  return values.map((value, index) => ({
    label: source[index]?.createdAt ?? `T-${values.length - index}`,
    value,
    x: values.length === 1 ? 50 : (index / (values.length - 1)) * 100,
    y: 92 - (value / max) * 74,
  }));
}

export function buildSvgPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
}
