/**
 * 운영자 세션 관련 타입 정의
 * - 세션 상태, 인증 모드, JWT 응답 등
 */

export type AuthMode = 'login' | 'password' | 'token' | 'cookie';

/** 운영자 세션 상태 */
export type SessionStatus = 'active' | 'expired' | 'error' | 'initializing';

/** JWT 로그인 응답 */
export interface LoginResponse {
  code: number;
  message: string;
  data: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    user: {
      id: number;
      email: string;
      username: string;
      role: string;
      balance: number;
      concurrency: number;
      status: string;
    };
  };
}

/** 운영자 세션 정보 */
export interface OperatorSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp (ms)
  userId: number;
  email: string;
  role: string;
  cookieHeader?: string;
}

/** 세션 헬스 체크 결과 */
export interface SessionHealth {
  status: SessionStatus;
  lastRefreshedAt: string | null;
  expiresAt: string | null;
  authMode: AuthMode;
  uptime: number;
}

/** 운영자 환경설정 */
export interface OperatorConfig {
  authMode: AuthMode;
  email?: string;
  password?: string;
  token?: string;
  cookie?: string;
  baseUrl: string;
  dashboardApiBase: string;
  directApiBase: string;
  proxyMode: 'operator' | 'direct';
  adminToken: string;
  alertWebhookUrl: string;
}
