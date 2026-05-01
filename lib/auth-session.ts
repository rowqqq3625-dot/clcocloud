import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import type { NextRequest } from "next/server";
import type { OAuthProfile } from "@/lib/auth-providers";

export const AUTH_STATE_COOKIE = "clko_oauth_state";
export const AUTH_SESSION_COOKIE = "clko_session";

export type AuthSession = OAuthProfile & {
  issuedAt: number;
};

export type AuthStatePayload = {
  provider: string;
  mode: string;
  nonce: string;
  returnTo?: string;
};

function getSecret() {
  return process.env.AUTH_SESSION_SECRET || "clkocloud-local-dev-secret-change-me";
}

export function sanitizeReturnTo(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return undefined;
  if (value.includes("\\")) return undefined;
  return value.slice(0, 512);
}

export function createStatePayload(provider: string, mode: string, returnTo?: string) {
  const payload: AuthStatePayload = {
    provider,
    mode,
    nonce: randomBytes(18).toString("base64url"),
    ...(returnTo ? { returnTo } : {})
  };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function signValue(value: string) {
  const signature = createHmac("sha256", getSecret()).update(value).digest("base64url");
  return `${value}.${signature}`;
}

export function verifySignedValue(signedValue: string | undefined) {
  if (!signedValue) return null;
  const lastDot = signedValue.lastIndexOf(".");
  if (lastDot < 1) return null;
  const value = signedValue.slice(0, lastDot);
  const signature = signedValue.slice(lastDot + 1);
  const expected = createHmac("sha256", getSecret()).update(value).digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return value;
}

export function parseStatePayload(value: string | null): AuthStatePayload | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<AuthStatePayload>;
    if (!parsed.provider || !parsed.mode || !parsed.nonce) return null;
    return {
      provider: String(parsed.provider),
      mode: parsed.mode === "signup" ? "signup" : "login",
      nonce: String(parsed.nonce),
      returnTo: sanitizeReturnTo(parsed.returnTo)
    };
  } catch {
    const [provider, mode, nonce] = value.split(".");
    if (!provider || !mode || !nonce) return null;
    return { provider, mode: mode === "signup" ? "signup" : "login", nonce };
  }
}

export function createSessionToken(profile: OAuthProfile) {
  const payload: AuthSession = { ...profile, issuedAt: Date.now() };
  return signValue(Buffer.from(JSON.stringify(payload), "utf8").toString("base64url"));
}

export function parseSessionToken(token: string | undefined): AuthSession | null {
  const verified = verifySignedValue(token);
  if (!verified) return null;
  try {
    const parsed = JSON.parse(Buffer.from(verified, "base64url").toString("utf8")) as AuthSession;
    if (!parsed.provider || !parsed.providerAccountId || !parsed.issuedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request: NextRequest) {
  return parseSessionToken(request.cookies.get(AUTH_SESSION_COOKIE)?.value);
}

export function getSessionFromCookies(cookieStore: ReadonlyRequestCookies) {
  return parseSessionToken(cookieStore.get(AUTH_SESSION_COOKIE)?.value);
}

export function isAdminSession(session: AuthSession | null) {
  const adminEmail = process.env.ADMIN_EMAIL || "gimjeonghugimk@gmail.com";
  return Boolean(
    session?.provider === "google" &&
    session.email &&
    session.email.toLowerCase() === adminEmail.toLowerCase()
  );
}
