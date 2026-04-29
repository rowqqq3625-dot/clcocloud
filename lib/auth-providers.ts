export type AuthProvider = "google" | "naver" | "kakao";
export type AuthMode = "login" | "signup";

export type OAuthProfile = {
  provider: AuthProvider;
  providerAccountId: string;
  email?: string;
  name?: string;
  image?: string;
};

type ProviderConfig = {
  id: AuthProvider;
  label: string;
  envPrefix: "GOOGLE" | "NAVER" | "KAKAO";
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string;
};

export const AUTH_PROVIDERS: Record<AuthProvider, ProviderConfig> = {
  google: {
    id: "google",
    label: "Google",
    envPrefix: "GOOGLE",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
    scope: "openid email profile"
  },
  naver: {
    id: "naver",
    label: "Naver",
    envPrefix: "NAVER",
    authorizeUrl: "https://nid.naver.com/oauth2.0/authorize",
    tokenUrl: "https://nid.naver.com/oauth2.0/token",
    userInfoUrl: "https://openapi.naver.com/v1/nid/me",
    scope: "name email profile_image"
  },
  kakao: {
    id: "kakao",
    label: "Kakao",
    envPrefix: "KAKAO",
    authorizeUrl: "https://kauth.kakao.com/oauth/authorize",
    tokenUrl: "https://kauth.kakao.com/oauth/token",
    userInfoUrl: "https://kapi.kakao.com/v2/user/me",
    scope: "profile_nickname profile_image"
  }
};

export function isAuthProvider(value: string): value is AuthProvider {
  return value === "google" || value === "naver" || value === "kakao";
}

export function normalizeAuthMode(value: string | null): AuthMode {
  return value === "signup" ? "signup" : "login";
}

export function getProviderCredentials(provider: AuthProvider) {
  const config = AUTH_PROVIDERS[provider];
  if (provider === "kakao") {
    return {
      clientId: process.env.KAKAO_CLIENT_ID || process.env.KAKAO_REST_API_KEY || "",
      clientSecret: process.env.KAKAO_CLIENT_SECRET || process.env.KAKAO_LOGIN_CODE || ""
    };
  }

  return {
    clientId: process.env[`${config.envPrefix}_CLIENT_ID`] || "",
    clientSecret: process.env[`${config.envPrefix}_CLIENT_SECRET`] || ""
  };
}

export function getAuthBaseUrl(requestUrl: string) {
  return process.env.NEXT_PUBLIC_SITE_URL || new URL(requestUrl).origin;
}
