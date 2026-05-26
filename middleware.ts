import { NextRequest, NextResponse } from "next/server";

const ADMIN_GATE_PATH = process.env.ADMIN_GATE_PATH || "/admin-gate";
const ADMIN_PANEL_PATH = process.env.ADMIN_PANEL_PATH || "/admin-panel";

const IS_DEV = process.env.NODE_ENV !== "production";

// Cookie names mirror lib/admin/config.ts. The `__Host-` prefix requires
// Secure (RFC 6265bis) which we can't satisfy on HTTP localhost during dev.
const ADMIN_SESSION_COOKIE = IS_DEV ? "clco-admin-session" : "__Host-clco-admin-session";
const ADMIN_ENTRY_COOKIE = "clco-admin-entry";

function buildAdminCsp(nonce: string): string {
  const supabaseHost = process.env.SUPABASE_URL
    ? new URL(process.env.SUPABASE_URL).host
    : "*.supabase.co";

  // Dev mode needs unsafe-inline + unsafe-eval for Next.js HMR / React Refresh.
  // In production we lock down to nonce + strict-dynamic so only scripts that
  // Next.js explicitly emits with the nonce can run.
  const scriptSrc = IS_DEV
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`;

  const connectSrc = IS_DEV
    ? "connect-src 'self' https: ws: wss:"
    : `connect-src 'self' https://${supabaseHost} https://*.supabase.co`;

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    connectSrc,
    "font-src 'self' data:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

function applyAdminHeaders(response: NextResponse, nonce: string) {
  response.headers.set("Content-Security-Policy", buildAdminCsp(nonce));
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
}

function randomNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/=+$/, "");
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Cookie-presence gating happens BEFORE we attach headers, so we can
  // return early without polluting the redirect with admin-only headers.
  if (pathname === ADMIN_GATE_PATH || pathname.startsWith(`${ADMIN_GATE_PATH}/`)) {
    if (!req.cookies.get(ADMIN_ENTRY_COOKIE)?.value) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  } else if (pathname === ADMIN_PANEL_PATH || pathname.startsWith(`${ADMIN_PANEL_PATH}/`)) {
    if (!req.cookies.get(ADMIN_SESSION_COOKIE)?.value) {
      return NextResponse.redirect(new URL(ADMIN_GATE_PATH, req.url));
    }
  }

  const nonce = randomNonce();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-csp-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  applyAdminHeaders(response, nonce);
  return response;
}

export const config = {
  // Run middleware ONLY on admin surfaces. Global security headers for the
  // public site live in next.config.mjs so they don't risk breaking the
  // marketing pages or Next.js inline hydration scripts.
  matcher: [
    "/admin-gate/:path*",
    "/admin-panel/:path*",
    "/api/admin/:path*",
  ],
};
