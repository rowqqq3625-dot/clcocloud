/**
 * 환경변수 기반 운영자 설정 (config)
 * - 환경변수에서 운영자 인증 정보를 안전하게 로드
 * - 실제 크레덴셜은 절대 로그/코드에 노출 금지
 */
import { z } from 'zod';
import type { OperatorConfig, AuthMode } from '../../types/session';
import {
  ROUTEAI_BROWSER_HOST,
  ROUTEAI_DASHBOARD_API_BASE,
  ROUTEAI_DIRECT_API_BASE,
} from '../upstream/host';

/** 환경변수 스키마 */
const envSchema = z.object({
  ROUTEAI_AUTH_MODE: z.enum(['login', 'password', 'token', 'cookie']).optional(),
  ROUTEAI_OPERATOR_EMAIL: z.string().optional(),
  ROUTEAI_OPERATOR_PASSWORD: z.string().optional(),
  ROUTEAI_OPERATOR_COOKIE: z.string().optional(),
  ROUTEAI_API_TOKEN: z.string().optional(),
  ROUTEAI_BROWSER_HOST: z.string().url().optional(),
  ROUTEAI_DASHBOARD_API_BASE: z.string().url().optional(),
  ROUTEAI_DIRECT_API_BASE: z.string().url().optional(),
  ROUTEAI_PROXY_MODE: z.enum(['operator', 'direct']).optional(),
  AIP_AUTH_MODE: z.enum(['password', 'token', 'cookie']).optional(),
  AIP_OPERATOR_EMAIL: z.string().optional(),
  AIP_OPERATOR_PASSWORD: z.string().optional(),
  AIP_OPERATOR_COOKIE: z.string().optional(),
  AIP_BASE_URL: z.string().url().optional(),
  ADMIN_TOKEN: z.string().optional().default(''),
  ALERT_WEBHOOK_URL: z.string().default(''),
});

let cachedConfig: OperatorConfig | null = null;

function hasOperatorCredentialEnv(env: z.infer<typeof envSchema>): boolean {
  const authMode = env.ROUTEAI_AUTH_MODE ?? env.AIP_AUTH_MODE ?? 'login';
  const hasLogin =
    (env.ROUTEAI_OPERATOR_EMAIL ?? env.AIP_OPERATOR_EMAIL ?? '') !== '' &&
    (env.ROUTEAI_OPERATOR_PASSWORD ?? env.AIP_OPERATOR_PASSWORD ?? '') !== '';
  const hasCookie = (env.ROUTEAI_OPERATOR_COOKIE ?? env.AIP_OPERATOR_COOKIE ?? '') !== '';
  const hasToken = (env.ROUTEAI_API_TOKEN ?? '') !== '';

  if (authMode === 'cookie') {
    return hasCookie;
  }
  if (authMode === 'token') {
    return hasToken;
  }
  return hasLogin;
}

function defaultProxyMode(env: z.infer<typeof envSchema>): 'operator' | 'direct' {
  if (env.ROUTEAI_PROXY_MODE !== undefined) {
    return env.ROUTEAI_PROXY_MODE;
  }
  if (hasOperatorCredentialEnv(env)) {
    return 'operator';
  }
  return 'direct';
}

/**
 * 환경변수에서 운영자 설정을 로드
 * - 한 번 파싱 후 캐시
 * - 크레덴셜은 절대 로그에 남기지 않음
 */
export function getOperatorConfig(): OperatorConfig {
  if (cachedConfig !== null) {
    return cachedConfig;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`[AIP] 환경변수 설정 오류: ${errors}`);
  }

  const env = parsed.data;
  const authMode = (env.ROUTEAI_AUTH_MODE ?? env.AIP_AUTH_MODE ?? 'login') as AuthMode;
  const email = env.ROUTEAI_OPERATOR_EMAIL ?? env.AIP_OPERATOR_EMAIL;
  const password = env.ROUTEAI_OPERATOR_PASSWORD ?? env.AIP_OPERATOR_PASSWORD;
  const cookie = env.ROUTEAI_OPERATOR_COOKIE ?? env.AIP_OPERATOR_COOKIE;
  const token = env.ROUTEAI_API_TOKEN;
  const baseUrl = env.ROUTEAI_BROWSER_HOST ?? env.AIP_BASE_URL ?? ROUTEAI_BROWSER_HOST;
  const proxyMode = defaultProxyMode(env);

  if (proxyMode === 'operator' && (authMode === 'login' || authMode === 'password') && ((email ?? '') === '' || (password ?? '') === '')) {
    throw new Error('[Dashboard] 환경변수 설정 오류: operator email/password가 필요합니다.');
  }

  if (proxyMode === 'operator' && authMode === 'cookie' && (cookie ?? '') === '') {
    throw new Error('[Dashboard] 환경변수 설정 오류: operator cookie가 필요합니다.');
  }

  if (proxyMode === 'operator' && authMode === 'token' && (token ?? '') === '') {
    throw new Error('[Dashboard] 환경변수 설정 오류: operator token이 필요합니다.');
  }

  cachedConfig = {
    authMode,
    email,
    password,
    cookie,
    token,
    baseUrl,
    dashboardApiBase: env.ROUTEAI_DASHBOARD_API_BASE ?? ROUTEAI_DASHBOARD_API_BASE,
    directApiBase: env.ROUTEAI_DIRECT_API_BASE ?? ROUTEAI_DIRECT_API_BASE,
    proxyMode,
    adminToken: env.ADMIN_TOKEN,
    alertWebhookUrl: env.ALERT_WEBHOOK_URL,
  };

  return cachedConfig;
}

/** 테스트용: 캐시 초기화 */
export function resetConfigCache(): void {
  cachedConfig = null;
}
