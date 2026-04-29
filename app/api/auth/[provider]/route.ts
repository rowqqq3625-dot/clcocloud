import { NextRequest, NextResponse } from "next/server";
import { AUTH_PROVIDERS, getAuthBaseUrl, getProviderCredentials, isAuthProvider, normalizeAuthMode } from "@/lib/auth-providers";
import { AUTH_STATE_COOKIE, createStatePayload, sanitizeReturnTo, signValue } from "@/lib/auth-session";

type RouteContext = {
  params: { provider: string };
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const provider = params.provider;
  if (!isAuthProvider(provider)) return NextResponse.redirect(new URL("/start?error=unknown_provider", request.url));

  const mode = normalizeAuthMode(request.nextUrl.searchParams.get("mode"));
  const returnTo = sanitizeReturnTo(request.nextUrl.searchParams.get("returnTo"));
  const config = AUTH_PROVIDERS[provider];
  const { clientId } = getProviderCredentials(provider);
  const fallbackPath = returnTo ? `/start?returnTo=${encodeURIComponent(returnTo)}` : "/start";

  if (!clientId) {
    const redirectUrl = new URL(`${fallbackPath}${fallbackPath.includes("?") ? "&" : "?"}error=provider_not_configured&provider=${provider}`, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  const baseUrl = getAuthBaseUrl(request.url);
  const redirectUri = `${baseUrl}/api/auth/callback/${provider}`;
  const statePayload = createStatePayload(provider, mode, returnTo);
  const state = signValue(statePayload);
  const authorizeUrl = new URL(config.authorizeUrl);

  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("scope", config.scope);
  if (provider === "google") authorizeUrl.searchParams.set("access_type", "offline");

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(AUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/"
  });
  return response;
}
