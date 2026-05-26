import "server-only";
import { ADMIN_GEO_FAIL_CLOSED } from "./config";

type HeaderSource =
  | Headers
  | { get(name: string): string | null }
  | Record<string, string | string[] | undefined>;

function readHeader(headers: HeaderSource, name: string): string | null {
  if (headers instanceof Headers) {
    return headers.get(name);
  }
  if (typeof (headers as { get?: unknown }).get === "function") {
    return (headers as { get(name: string): string | null }).get(name);
  }
  const map = headers as Record<string, string | string[] | undefined>;
  const value = map[name] ?? map[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/**
 * Vercel sets x-vercel-ip-country, Cloudflare sets cf-ipcountry.
 * Returns a normalized uppercase ISO-3166-1 alpha-2 code or null.
 */
export function getCountryFromRequest(headers: HeaderSource): string | null {
  const candidates = ["x-vercel-ip-country", "cf-ipcountry"];
  for (const name of candidates) {
    const raw = readHeader(headers, name);
    if (raw && raw.trim()) return raw.trim().toUpperCase();
  }
  return null;
}

/**
 * KR-only gate.
 * - country=KR  → true
 * - country!=KR → false
 * - missing     → false when ADMIN_GEO_FAIL_CLOSED (default), true otherwise
 */
export function isKoreaRequest(headers: HeaderSource): boolean {
  const country = getCountryFromRequest(headers);
  if (country === "KR") return true;
  if (country) return false;
  return !ADMIN_GEO_FAIL_CLOSED;
}

export function getClientIp(headers: HeaderSource): string | null {
  const xff = readHeader(headers, "x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = readHeader(headers, "x-real-ip");
  if (realIp) return realIp.trim();
  return null;
}
