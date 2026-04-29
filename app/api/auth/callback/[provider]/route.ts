import { NextRequest, NextResponse } from "next/server";
import { AUTH_PROVIDERS, AuthProvider, OAuthProfile, getAuthBaseUrl, getProviderCredentials, isAuthProvider } from "@/lib/auth-providers";
import { AUTH_SESSION_COOKIE, AUTH_STATE_COOKIE, createSessionToken, parseStatePayload, verifySignedValue } from "@/lib/auth-session";

type RouteContext = {
  params: { provider: string };
};

type TokenResponse = {
  access_token?: string;
  token_type?: string;
  error?: string;
};

function getStateInfo(state: string) {
  return parseStatePayload(verifySignedValue(state));
}

async function exchangeCode(provider: AuthProvider, code: string, redirectUri: string, state: string): Promise<TokenResponse> {
  const config = AUTH_PROVIDERS[provider];
  const { clientId, clientSecret } = getProviderCredentials(provider);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    code,
    redirect_uri: redirectUri
  });

  if (clientSecret) body.set("client_secret", clientSecret);
  if (provider === "naver") body.set("state", state);

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  return response.json() as Promise<TokenResponse>;
}

async function fetchProfile(provider: AuthProvider, accessToken: string): Promise<OAuthProfile> {
  const response = await fetch(AUTH_PROVIDERS[provider].userInfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });
  const data = await response.json();

  if (provider === "google") {
    return {
      provider,
      providerAccountId: String(data.sub),
      email: data.email,
      name: data.name,
      image: data.picture
    };
  }

  if (provider === "naver") {
    const profile = data.response || {};
    return {
      provider,
      providerAccountId: String(profile.id),
      email: profile.email,
      name: profile.name || profile.nickname,
      image: profile.profile_image
    };
  }

  const kakaoAccount = data.kakao_account || {};
  const kakaoProfile = kakaoAccount.profile || {};
  return {
    provider,
    providerAccountId: String(data.id),
    email: kakaoAccount.email,
    name: kakaoProfile.nickname,
    image: kakaoProfile.profile_image_url
  };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const provider = params.provider;
  if (!isAuthProvider(provider)) return NextResponse.redirect(new URL("/start?error=unknown_provider", request.url));

  const providerError = request.nextUrl.searchParams.get("error");
  if (providerError) {
    return NextResponse.redirect(new URL(`/start?error=oauth_failed&provider=${provider}`, request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get(AUTH_STATE_COOKIE)?.value;
  const stateInfo = state ? getStateInfo(state) : null;
  const fallbackPath = stateInfo?.returnTo ? `/start?returnTo=${encodeURIComponent(stateInfo.returnTo)}` : "/start";

  if (!code || !state || !storedState || state !== storedState || stateInfo?.provider !== provider) {
    return NextResponse.redirect(new URL(`${fallbackPath}${fallbackPath.includes("?") ? "&" : "?"}error=invalid_state`, request.url));
  }

  const { clientId, clientSecret } = getProviderCredentials(provider);
  if (!clientId || (provider !== "kakao" && !clientSecret)) {
    return NextResponse.redirect(new URL(`${fallbackPath}${fallbackPath.includes("?") ? "&" : "?"}error=provider_not_configured&provider=${provider}`, request.url));
  }

  try {
    const baseUrl = getAuthBaseUrl(request.url);
    const token = await exchangeCode(provider, code, `${baseUrl}/api/auth/callback/${provider}`, state);
    if (!token.access_token) throw new Error(token.error || "token_exchange_failed");

    const profile = await fetchProfile(provider, token.access_token);
    const response = NextResponse.redirect(new URL(stateInfo?.returnTo || "/dashboard", request.url));
    response.cookies.delete(AUTH_STATE_COOKIE);
    response.cookies.set(AUTH_SESSION_COOKIE, createSessionToken(profile), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 14,
      path: "/"
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL(`${fallbackPath}${fallbackPath.includes("?") ? "&" : "?"}error=oauth_failed&provider=${provider}`, request.url));
  }
}
