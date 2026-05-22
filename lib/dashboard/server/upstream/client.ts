import 'server-only';

import { z } from 'zod';
import { fp16 } from '../keys/fingerprint';
import { getOperatorConfig } from '../session/config';
import { AipSessionExpiredError } from '../session/operator-session';
import {
  ROUTEAI_BROWSER_HOST,
  ROUTEAI_DASHBOARD_API_BASE,
  ROUTEAI_DIRECT_USAGE_ENDPOINTS,
} from './host';
import {
  AccountKeysResponseSchema,
  AccountKeyDtoSchema,
  UsageEventsPageDtoSchema,
  UsageEventsResponseSchema,
  UsageSummaryDtoSchema,
  UsageSummaryResponseSchema,
  type AccountKeyDto,
  type UsageEventDto,
  type UsageEventsPageDto,
  type UsageEventsPageRequest,
  type UsageRange,
  type UsageSummaryDto,
} from './types';
import type { OperatorSession } from '../../types/session';

const CONNECT_TIMEOUT_MS = 10_000;
const TOTAL_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 3;
const DIRECT_RECURSION_DEPTH = 5;
const DIRECT_ARRAY_KEYS = new Set([
  'items',
  'rows',
  'records',
  'events',
  'history',
  'requests',
  'logs',
  'request_logs',
  'usage_logs',
  'api_usage',
  'calls',
  'messages',
  'completions',
  'transactions',
  'data',
  'result',
  'payload',
]);
const DIRECT_EXCLUDED_ARRAY_KEYS = new Set([
  'model_stats',
  'modelStats',
  'stats',
  'summary',
  'summaries',
  'totals',
]);
const DIRECT_META_KEYS = new Set([
  'data',
  'usage',
  'result',
  'payload',
  'subscription',
  'account',
  'key',
  'balance',
  'quota',
]);
const OPERATOR_HISTORY_PATHS = [
  '/usage',
  '/usage/logs',
  '/logs',
  '/log/self',
  '/api/log/self',
  '/api/usage/logs',
];
type DirectMethod = 'GET' | 'POST';
type DirectAuthMode = 'bearer' | 'x-api-key' | 'anthropic-auth-token';

interface DirectStrategy {
  method: DirectMethod;
  authMode: DirectAuthMode;
}

interface DirectDiagnostic {
  host: string;
  method: DirectMethod;
  authMode: DirectAuthMode;
  code: string;
}

const DIRECT_STRATEGIES: DirectStrategy[] = [
  { method: 'GET', authMode: 'bearer' },
  { method: 'GET', authMode: 'x-api-key' },
  { method: 'GET', authMode: 'anthropic-auth-token' },
  { method: 'POST', authMode: 'bearer' },
  { method: 'POST', authMode: 'x-api-key' },
  { method: 'POST', authMode: 'anthropic-auth-token' },
];

export class AipUpstreamError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'AipUpstreamError';
  }
}

export class AipUpstreamParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AipUpstreamParseError';
  }
}

export class AipUpstreamTimeoutError extends Error {
  constructor(message = 'RouteAI upstream request timed out') {
    super(message);
    this.name = 'AipUpstreamTimeoutError';
  }
}

export class AipDirectKeyRejectedError extends Error {
  constructor(message = 'RouteAI rejected the supplied API key') {
    super(message);
    this.name = 'AipDirectKeyRejectedError';
  }
}

export class AipDirectEndpointUnconfirmedError extends Error {
  constructor(message = 'RouteAI direct usage endpoint is not confirmed') {
    super(message);
    this.name = 'AipDirectEndpointUnconfirmedError';
  }
}

export class AipUpstreamShapeError extends Error {
  constructor(message = 'RouteAI upstream usage shape is not confirmed') {
    super(message);
    this.name = 'AipUpstreamShapeError';
  }
}

function rangeParams(range: UsageRange): URLSearchParams {
  const params = new URLSearchParams({
    start_date: range.startDate,
    end_date: range.endDate,
    timezone: range.timezone ?? 'Asia/Seoul',
  });

  return params;
}

function appendKeyFilter(params: URLSearchParams, keyFilter?: string): void {
  if (keyFilter !== undefined && keyFilter !== '') {
    params.set('api_key_id', keyFilter);
  }
}

function backoffMs(attempt: number): number {
  return 250 * 2 ** (attempt - 1);
}

function isLoginRedirect(response: Response): boolean {
  const location = response.headers.get('location') ?? '';
  return response.redirected || /\/login|\/auth\/login/i.test(location);
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function apiUrl(base: string, path: string): URL {
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return new URL(path.replace(/^\/+/g, ''), normalizedBase);
}

function operatorApiUrl(path: string): URL {
  const config = getOperatorConfig();
  if (path.startsWith('/api/')) {
    return new URL(path, config.baseUrl ?? ROUTEAI_BROWSER_HOST);
  }
  return apiUrl(config.dashboardApiBase, path);
}

async function parseJson<T>(
  schema: z.ZodType<T, any, any>,
  response: Response,
  label: string
): Promise<T> {
  let json: unknown;

  try {
    json = await response.json();
  } catch (error) {
    throw new AipUpstreamParseError(
      `${label} returned invalid JSON: ${error instanceof Error ? error.message : 'unknown error'}`
    );
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new AipUpstreamParseError(
      `${label} returned unexpected shape: ${parsed.error.issues
        .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
        .join('; ')}`
    );
  }

  return parsed.data;
}

async function fetchUpstream<T>(
  session: OperatorSession,
  path: string,
  schema: z.ZodSchema<T>,
  label: string
): Promise<T> {
  const config = getOperatorConfig();
  const url = apiUrl(config.dashboardApiBase, path);
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const totalTimer = setTimeout(() => controller.abort(new AipUpstreamTimeoutError()), TOTAL_TIMEOUT_MS);
    const connectTimer = setTimeout(
      () => controller.abort(new AipUpstreamTimeoutError('RouteAI upstream connection timed out')),
      CONNECT_TIMEOUT_MS
    );

    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (session.cookieHeader !== undefined && session.cookieHeader !== '') {
        headers.Cookie = session.cookieHeader;
      } else {
        headers.Authorization = `Bearer ${session.accessToken}`;
      }

      if (url.hostname.endsWith('routeai.cc')) {
        const stripeCookies = process.env.ROUTEAI_COOKIES || '__stripe_sid=334f2807-6c50-43a5-8a1e-b18a4184fbf289bcae; __stripe_mid=6f8bb1a8-b997-4d10-a330-a2f75883fa35cce084';
        if (headers.Cookie) {
          headers.Cookie = `${headers.Cookie}; ${stripeCookies}`;
        } else {
          headers.Cookie = stripeCookies;
        }
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
        redirect: 'manual',
        signal: controller.signal,
      });
      clearTimeout(connectTimer);

      if (response.status === 401 || isLoginRedirect(response)) {
        throw new AipSessionExpiredError('RouteAI operator session expired');
      }

      if (response.status >= 400 && response.status < 500) {
        throw new AipUpstreamError(`${label} failed with HTTP ${response.status}`, response.status);
      }

      if (response.status >= 500) {
        throw new AipUpstreamError(`${label} failed with HTTP ${response.status}`, response.status);
      }

      return await parseJson(schema, response, label);
    } catch (error) {
      lastError = error;

      if (
        error instanceof AipSessionExpiredError ||
        error instanceof AipUpstreamParseError ||
        (error instanceof AipUpstreamError && error.status !== undefined && error.status < 500)
      ) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new AipUpstreamTimeoutError();
      }

      if (attempt === MAX_ATTEMPTS) {
        break;
      }

      await sleep(backoffMs(attempt));
    } finally {
      clearTimeout(connectTimer);
      clearTimeout(totalTimer);
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new AipUpstreamError(`${label} failed`);
}

async function fetchUpstreamJson(
  session: OperatorSession,
  url: URL,
  label: string
): Promise<unknown> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const totalTimer = setTimeout(() => controller.abort(new AipUpstreamTimeoutError()), TOTAL_TIMEOUT_MS);
    const connectTimer = setTimeout(
      () => controller.abort(new AipUpstreamTimeoutError('RouteAI upstream connection timed out')),
      CONNECT_TIMEOUT_MS
    );

    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (session.cookieHeader !== undefined && session.cookieHeader !== '') {
        headers.Cookie = session.cookieHeader;
      } else {
        headers.Authorization = `Bearer ${session.accessToken}`;
      }

      if (url.hostname.endsWith('routeai.cc')) {
        const stripeCookies = process.env.ROUTEAI_COOKIES || '__stripe_sid=334f2807-6c50-43a5-8a1e-b18a4184fbf289bcae; __stripe_mid=6f8bb1a8-b997-4d10-a330-a2f75883fa35cce084';
        if (headers.Cookie) {
          headers.Cookie = `${headers.Cookie}; ${stripeCookies}`;
        } else {
          headers.Cookie = stripeCookies;
        }
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
        redirect: 'manual',
        signal: controller.signal,
      });
      clearTimeout(connectTimer);

      if (response.status === 401 || isLoginRedirect(response)) {
        throw new AipSessionExpiredError('RouteAI operator session expired');
      }

      if (response.status >= 400 && response.status < 500) {
        throw new AipUpstreamError(`${label} failed with HTTP ${response.status}`, response.status);
      }

      if (response.status >= 500) {
        throw new AipUpstreamError(`${label} failed with HTTP ${response.status}`, response.status);
      }

      const contentType = response.headers.get('content-type') ?? '';
      const text = await response.text();
      if (contentType.includes('text/html') || /^\s*</.test(text)) {
        throw new AipDirectEndpointUnconfirmedError(`${label} returned HTML instead of JSON`);
      }

      try {
        return JSON.parse(text) as unknown;
      } catch (error) {
        throw new AipUpstreamParseError(
          `${label} returned invalid JSON: ${error instanceof Error ? error.message : 'unknown error'}`
        );
      }
    } catch (error) {
      lastError = error;

      if (
        error instanceof AipSessionExpiredError ||
        error instanceof AipUpstreamParseError ||
        error instanceof AipDirectEndpointUnconfirmedError ||
        (error instanceof AipUpstreamError && error.status !== undefined && error.status < 500)
      ) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new AipUpstreamTimeoutError();
      }

      if (attempt === MAX_ATTEMPTS) {
        break;
      }

      await sleep(backoffMs(attempt));
    } finally {
      clearTimeout(connectTimer);
      clearTimeout(totalTimer);
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new AipUpstreamError(`${label} failed`);
}

function directUsageUrls(params: URLSearchParams): URL[] {
  const config = getOperatorConfig();
  const configured = apiUrl(config.directApiBase, `/usage?${params.toString()}`).toString();
  const envEndpoints = (process.env.ROUTEAI_DIRECT_USAGE_ENDPOINTS ?? '')
    .split(',')
    .map((endpoint) => endpoint.trim())
    .filter((endpoint) => endpoint !== '');
  return Array.from(
    new Set([
      configured,
      ...envEndpoints.map((endpoint) => `${endpoint}${endpoint.includes('?') ? '&' : '?'}${params.toString()}`),
      ...ROUTEAI_DIRECT_USAGE_ENDPOINTS.map((endpoint) => `${endpoint}?${params.toString()}`),
    ])
  )
    .map((value) => new URL(value))
    .filter(isDirectJsonUsageUrl);
}

function isDirectJsonUsageUrl(url: URL): boolean {
  return true;
}

function directHeaders(plaintextKey: string, authMode: DirectAuthMode): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (authMode === 'bearer') {
    headers.Authorization = `Bearer ${plaintextKey}`;
  } else if (authMode === 'x-api-key') {
    headers['x-api-key'] = plaintextKey;
  } else {
    headers['anthropic-auth-token'] = plaintextKey;
  }

  return headers;
}

function directPostBody(url: URL): string {
  return JSON.stringify(Object.fromEntries(url.searchParams.entries()));
}

async function fetchDirectUrlWithUserKey(
  plaintextKey: string,
  url: URL,
  label: string,
  strategy: DirectStrategy
): Promise<unknown> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const totalTimer = setTimeout(() => controller.abort(new AipUpstreamTimeoutError()), TOTAL_TIMEOUT_MS);
    const connectTimer = setTimeout(
      () => controller.abort(new AipUpstreamTimeoutError('RouteAI upstream connection timed out')),
      CONNECT_TIMEOUT_MS
    );

    try {
      const headers = directHeaders(plaintextKey, strategy.authMode);
      if (strategy.method === 'POST') {
        headers['Content-Type'] = 'application/json';
      }

      if (url.hostname.endsWith('routeai.cc')) {
        const stripeCookies = process.env.ROUTEAI_COOKIES || '__stripe_sid=334f2807-6c50-43a5-8a1e-b18a4184fbf289bcae; __stripe_mid=6f8bb1a8-b997-4d10-a330-a2f75883fa35cce084';
        if (headers.Cookie || headers.cookie) {
          const oldCookie = headers.Cookie || headers.cookie;
          headers.Cookie = `${oldCookie}; ${stripeCookies}`;
        } else {
          headers.Cookie = stripeCookies;
        }
      }

      const response = await fetch(url, {
        method: strategy.method,
        headers,
        body: strategy.method === 'POST' ? directPostBody(url) : undefined,
        redirect: 'manual',
        signal: controller.signal,
      });
      clearTimeout(connectTimer);

      if (response === undefined) {
        throw new AipDirectEndpointUnconfirmedError(`${label} endpoint did not return a response`);
      }

      if (response.status === 401 || response.status === 403) {
        throw new AipDirectKeyRejectedError(`${label} rejected the supplied API key`);
      }

      if (response.status === 404) {
        throw new AipDirectEndpointUnconfirmedError(`${label} endpoint not found`);
      }

      if (response.status >= 400 && response.status < 500) {
        throw new AipUpstreamError(`${label} failed with HTTP ${response.status}`, response.status);
      }

      if (response.status >= 500) {
        throw new AipUpstreamError(`${label} failed with HTTP ${response.status}`, response.status);
      }

      const contentType = response.headers.get('content-type') ?? '';
      const text = await response.text();
      const looksHtml = contentType.includes('text/html') || /^\s*</.test(text);
      if (looksHtml) {
        throw new AipDirectEndpointUnconfirmedError(`${label} returned HTML instead of JSON`);
      }

      try {
        return JSON.parse(text) as unknown;
      } catch (error) {
        throw new AipDirectEndpointUnconfirmedError(
          `${label} returned non-JSON response: ${error instanceof Error ? error.message : 'unknown error'}`
        );
      }
    } catch (error) {
      lastError = error;
      if (
        error instanceof AipDirectKeyRejectedError ||
        error instanceof AipDirectEndpointUnconfirmedError ||
        (error instanceof AipUpstreamError && error.status !== undefined && error.status < 500)
      ) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new AipUpstreamTimeoutError();
      }

      if (attempt === MAX_ATTEMPTS) {
        break;
      }

      await sleep(backoffMs(attempt));
    } finally {
      clearTimeout(connectTimer);
      clearTimeout(totalTimer);
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new AipUpstreamError(`${label} failed`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readArray(value: unknown): unknown[] | null {
  return Array.isArray(value) ? value : null;
}

function firstArray(...values: unknown[]): unknown[] | null {
  let empty: unknown[] | null = null;
  for (const value of values) {
    const array = readArray(value);
    if (array !== null && array.length > 0) {
      return array;
    }
    if (array !== null && empty === null) {
      empty = array;
    }
  }
  return empty;
}

function numberFrom(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function optionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function roundedMoney(value: number): number {
  return Number(value.toFixed(4));
}

function readDirectMeta(root: Record<string, unknown>): Record<string, unknown> {
  const quota = isRecord(root.quota) ? root.quota : {};
  const subscription = isRecord(root.subscription) ? root.subscription : {};
  const usage = isRecord(root.usage) ? root.usage : {};
  const totalUsage = isRecord(usage.total) ? usage.total : {};
  const todayUsage = isRecord(usage.today) ? usage.today : {};
  const monthlyLimit = optionalNumber(subscription.monthly_limit_usd);
  const weeklyLimit = optionalNumber(subscription.weekly_limit_usd);
  const dailyLimit = optionalNumber(subscription.daily_limit_usd);
  const monthlyUsage = optionalNumber(subscription.monthly_usage_usd);
  const weeklyUsage = optionalNumber(subscription.weekly_usage_usd);
  const dailyUsage = optionalNumber(subscription.daily_usage_usd);
  const totalAmount =
    optionalNumber(root.total_amount) ??
    optionalNumber(root.initial_amount) ??
    optionalNumber(root.initial_balance) ??
    optionalNumber(root.initial_balance_usd) ??
    optionalNumber(root.total_balance) ??
    optionalNumber(root.total_balance_usd) ??
    optionalNumber(root.limit) ??
    optionalNumber(root.amount) ??
    optionalNumber(quota.limit) ??
    optionalNumber(quota.total) ??
    optionalNumber(quota.total_amount) ??
    optionalNumber(quota.initial_balance) ??
    optionalNumber(subscription.total_amount) ??
    optionalNumber(subscription.initial_balance) ??
    optionalNumber(subscription.balance) ??
    monthlyLimit ??
    weeklyLimit ??
    dailyLimit ??
    findFirstNumberByKey(root, [
      'total_amount',
      'initial_amount',
      'initial_balance',
      'initial_balance_usd',
      'total_balance',
      'total_balance_usd',
      'monthly_limit_usd',
      'limit',
    ]);
  const usedAmount =
    optionalNumber(root.used_amount) ??
    optionalNumber(root.used_usd) ??
    optionalNumber(root.total_used) ??
    optionalNumber(root.total_usage_usd) ??
    optionalNumber(root.quota_used) ??
    optionalNumber(quota.used) ??
    optionalNumber(quota.used_amount) ??
    optionalNumber(subscription.used_amount) ??
    monthlyUsage ??
    weeklyUsage ??
    dailyUsage ??
    optionalNumber(totalUsage.actual_cost) ??
    optionalNumber(totalUsage.cost) ??
    optionalNumber(todayUsage.actual_cost) ??
    optionalNumber(todayUsage.cost) ??
    findFirstNumberByKey(root, [
      'used_amount',
      'used_usd',
      'total_used',
      'total_usage_usd',
      'quota_used',
      'monthly_usage_usd',
      'actual_cost',
      'cost',
    ]);
  const remaining =
    optionalNumber(root.remaining) ??
    optionalNumber(root.remaining_balance) ??
    optionalNumber(root.remaining_usd) ??
    optionalNumber(root.current_balance) ??
    optionalNumber(root.current_balance_usd) ??
    optionalNumber(root.balance) ??
    optionalNumber(root.amount) ??
    optionalNumber(quota.remaining) ??
    optionalNumber(quota.remaining_balance) ??
    optionalNumber(subscription.remaining) ??
    optionalNumber(subscription.remaining_balance) ??
    findFirstNumberByKey(root, [
      'remaining',
      'remaining_balance',
      'remaining_usd',
      'current_balance',
      'current_balance_usd',
      'balance',
    ]);
  const computedBaseline =
    remaining !== undefined && usedAmount !== undefined ? roundedMoney(remaining + usedAmount) : undefined;
  return {
    direct_remaining: remaining,
    direct_balance: optionalNumber(root.balance),
    direct_quota: optionalNumber(quota.limit) ?? optionalNumber(quota.total) ?? totalAmount,
    direct_quota_used: optionalNumber(quota.used) ?? usedAmount,
    direct_total_amount: totalAmount,
    direct_used_amount: usedAmount,
    direct_initial_amount:
      optionalNumber(root.initial_amount) ??
      optionalNumber(root.original_amount) ??
      optionalNumber(root.initial_balance) ??
      optionalNumber(root.initial_balance_usd) ??
      totalAmount ??
      computedBaseline,
    direct_baseline_amount:
      optionalNumber(root.baseline_amount) ??
      optionalNumber(root.balance_before_use) ??
      optionalNumber(root.balance) ??
      optionalNumber(root.remaining_balance) ??
      optionalNumber(root.current_balance) ??
      optionalNumber(quota.limit) ??
      optionalNumber(subscription.balance) ??
      computedBaseline,
    direct_last_used_at: typeof root.last_used_at === 'string' ? root.last_used_at : undefined,
    direct_status: typeof root.status === 'string' ? root.status : 'active',
    direct_summary_requests:
      optionalNumber(totalUsage.requests) ??
      optionalNumber(todayUsage.requests) ??
      findFirstNumberByKey(root, ['total_requests', 'requests']),
    direct_summary_input_tokens:
      optionalNumber(totalUsage.input_tokens) ??
      optionalNumber(todayUsage.input_tokens) ??
      findFirstNumberByKey(root, ['total_input_tokens', 'input_tokens', 'prompt_tokens']),
    direct_summary_output_tokens:
      optionalNumber(totalUsage.output_tokens) ??
      optionalNumber(todayUsage.output_tokens) ??
      findFirstNumberByKey(root, ['total_output_tokens', 'output_tokens', 'completion_tokens']),
    direct_summary_total_tokens:
      optionalNumber(totalUsage.total_tokens) ??
      optionalNumber(todayUsage.total_tokens) ??
      findFirstNumberByKey(root, ['total_tokens', 'tokens']),
    direct_summary_cost: optionalNumber(totalUsage.cost) ?? optionalNumber(todayUsage.cost),
    direct_summary_actual_cost: optionalNumber(totalUsage.actual_cost) ?? optionalNumber(todayUsage.actual_cost),
    direct_summary_duration_ms: optionalNumber(usage.average_duration_ms),
    direct_model_stats: Array.isArray(root.model_stats) ? root.model_stats : undefined,
  };
}

function findFirstNumberByKey(root: Record<string, unknown>, keys: string[]): number | undefined {
  const wanted = new Set(keys.map((key) => key.toLowerCase()));
  const seen = new Set<Record<string, unknown>>();

  function visit(value: unknown, depth: number, key = ''): number | undefined {
    if (depth > DIRECT_RECURSION_DEPTH) {
      return undefined;
    }
    if (wanted.has(key.toLowerCase())) {
      const parsed = optionalNumber(value);
      if (parsed !== undefined) {
        return parsed;
      }
    }
    if (!isRecord(value) || seen.has(value)) {
      return undefined;
    }
    seen.add(value);
    for (const [childKey, childValue] of Object.entries(value)) {
      const found = visit(childValue, depth + 1, childKey);
      if (found !== undefined) {
        return found;
      }
    }
    return undefined;
  }

  return visit(root, 0);
}

function directMetaSources(root: Record<string, unknown>, dataRecord: Record<string, unknown>): Record<string, unknown>[] {
  const sources: Record<string, unknown>[] = [];
  const seen = new Set<Record<string, unknown>>();

  function visit(record: Record<string, unknown>, depth: number): void {
    if (seen.has(record) || depth > DIRECT_RECURSION_DEPTH) {
      return;
    }
    seen.add(record);
    sources.push(record);

    for (const [key, value] of Object.entries(record)) {
      if (isRecord(value) && DIRECT_META_KEYS.has(key)) {
        visit(value, depth + 1);
      }
    }
  }

  visit(root, 0);
  if (dataRecord !== root) {
    visit(dataRecord, 0);
  }

  return sources;
}

function readDirectMetaFromSources(root: Record<string, unknown>, dataRecord: Record<string, unknown>): Record<string, unknown> {
  return directMetaSources(root, dataRecord).reduce<Record<string, unknown>>((meta, source) => {
    for (const [key, value] of Object.entries(definedMeta(readDirectMeta(source)))) {
      if (meta[key] === undefined) {
        meta[key] = value;
      }
    }
    return meta;
  }, {});
}

function stringFrom(value: unknown): string | null {
  return typeof value === 'string' ? value.trim() : null;
}

function nestedRecord(root: Record<string, unknown>, key: string): Record<string, unknown> {
  return isRecord(root[key]) ? root[key] : {};
}

function firstValue(root: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const value = root[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return undefined;
}

function firstNestedValue(root: Record<string, unknown>, keys: string[]): unknown {
  const metadata = nestedRecord(root, 'metadata');
  const request = nestedRecord(root, 'request');
  const message = nestedRecord(root, 'message');
  const usage = nestedRecord(root, 'usage');

  return (
    firstValue(root, keys) ??
    firstValue(metadata, keys) ??
    firstValue(request, keys) ??
    firstValue(message, keys) ??
    firstValue(usage, keys)
  );
}

function looksLikeUsageRow(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return firstNestedValue(value, [
    'model',
    'modelName',
    'model_name',
    'input_tokens',
    'inputTokens',
    'output_tokens',
    'outputTokens',
    'total_tokens',
    'totalTokens',
    'tokens',
    'cost',
    'costUsd',
    'actual_cost',
    'actualCostUsd',
    'request_id',
    'requestId',
    'message_id',
    'messageId',
    'created_at',
    'createdAt',
    'timestamp',
    'request_time',
    'requestTime',
  ]) !== undefined;
}

function looksLikeUsageRows(value: unknown[], key: string): boolean {
  if (DIRECT_EXCLUDED_ARRAY_KEYS.has(key) || value.length === 0) {
    return false;
  }

  return value.some(looksLikeUsageRow);
}

function isSlashCommandRow(row: unknown): boolean {
  if (!isRecord(row)) {
    return false;
  }

  const metadata = nestedRecord(row, 'metadata');
  const request = nestedRecord(row, 'request');
  const candidates = [
    row.prompt,
    row.input,
    row.message,
    row.command,
    row.tool,
    metadata.command,
    metadata.prompt,
    metadata.input,
    metadata.message,
    request.command,
    request.prompt,
    request.input,
    request.message,
  ];

  if (stringFrom(row.type)?.toLowerCase().includes('slash') === true) {
    return true;
  }
  if (stringFrom(metadata.type)?.toLowerCase().includes('slash') === true) {
    return true;
  }
  if (metadata.is_slash_command === true || row.is_slash_command === true) {
    return true;
  }

  return candidates.some((candidate) => {
    const text = stringFrom(candidate);
    return text !== null && text.startsWith('/');
  });
}

function withDirectMetaRows(rows: unknown[], root: Record<string, unknown>, dataRecord: Record<string, unknown>): unknown[] {
  const meta = readDirectMetaFromSources(root, dataRecord);

  return rows
    .filter((row) => !isSlashCommandRow(row))
    .map((item) => {
      const row = isRecord(item) ? item : {};
      return {
        ...row,
        keyIdentifier: row.api_key_id ?? row.key_id ?? row.token_id ?? '__direct_key__',
        created_at:
          row.created_at ??
          row.createdAt ??
          row.timestamp ??
          row.time ??
          row.date ??
          row.request_time ??
          row.requestTime ??
          row.started_at ??
          row.startedAt ??
          row.completed_at ??
          row.completedAt ??
          firstNestedValue(row, ['created_at', 'createdAt', 'timestamp', 'time', 'date', 'request_time', 'requestTime', 'started_at', 'startedAt', 'completed_at', 'completedAt']),
        ...meta,
      };
    });
}

function withOperatorHistoryRows(rows: unknown[], keyFilter?: string): unknown[] {
  return rows
    .filter((row) => !isSlashCommandRow(row))
    .map((item) => {
      const row = isRecord(item) ? item : {};
      return {
        ...row,
        keyIdentifier: row.keyIdentifier ?? row.api_key_id ?? row.key_id ?? row.token_id ?? keyFilter,
        created_at:
          row.created_at ??
          row.createdAt ??
          row.timestamp ??
          row.time ??
          row.date ??
          row.request_time ??
          row.requestTime ??
          row.started_at ??
          row.startedAt ??
          row.completed_at ??
          row.completedAt ??
          firstNestedValue(row, ['created_at', 'createdAt', 'timestamp', 'time', 'date', 'request_time', 'requestTime', 'started_at', 'startedAt', 'completed_at', 'completedAt']),
      };
    });
}

function definedMeta(meta: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(meta).filter(([, value]) => value !== undefined));
}

function hasDirectUsageSnapshot(root: Record<string, unknown>, dataRecord: Record<string, unknown>): boolean {
  const meta = readDirectMetaFromSources(root, dataRecord);
  return Object.keys(meta).length > 0 || [
    root.usage,
    root.model_stats,
    root.remaining,
    root.balance,
    root.quota,
    root.subscription,
    root.mode,
    dataRecord.usage,
    dataRecord.model_stats,
    dataRecord.remaining,
    dataRecord.balance,
    dataRecord.quota,
    dataRecord.subscription,
    dataRecord.mode,
  ].some((value) => value !== undefined && value !== null);
}

function directUsageArrayCandidates(
  root: Record<string, unknown>,
  dataRecord: Record<string, unknown>
): unknown[] {
  const candidates: unknown[] = [];
  const seen = new Set<Record<string, unknown>>();

  function visit(value: unknown, depth: number, key = ''): void {
    if (depth > DIRECT_RECURSION_DEPTH) {
      return;
    }
    if (Array.isArray(value)) {
      if ((DIRECT_ARRAY_KEYS.has(key) || key === '' || looksLikeUsageRows(value, key)) && !DIRECT_EXCLUDED_ARRAY_KEYS.has(key)) {
        candidates.push(value);
      }
      return;
    }
    if (!isRecord(value) || seen.has(value)) {
      return;
    }
    seen.add(value);

    for (const [childKey, childValue] of Object.entries(value)) {
      if (Array.isArray(childValue) && (DIRECT_ARRAY_KEYS.has(childKey) || looksLikeUsageRows(childValue, childKey)) && !DIRECT_EXCLUDED_ARRAY_KEYS.has(childKey)) {
        candidates.push(childValue);
        continue;
      }
      if (isRecord(childValue)) {
        visit(childValue, depth + 1, childKey);
      }
    }
  }

  visit(root, 0);
  if (dataRecord !== root) {
    visit(dataRecord, 0);
  }

  return candidates;
}

function directSnapshotRow(root: Record<string, unknown>, dataRecord: Record<string, unknown>): unknown {
  const meta = readDirectMetaFromSources(root, dataRecord);
  const createdAt =
    typeof root.last_used_at === 'string'
      ? root.last_used_at
      : typeof dataRecord.last_used_at === 'string'
        ? dataRecord.last_used_at
        : undefined;

  return {
    keyIdentifier: '__direct_key__',
    created_at: createdAt,
    _directMetaOnly: true,
    ...meta,
  };
}

function timeValue(row: UsageEventDto): number {
  const value = row.created_at;
  if (value === undefined || value === '') {
    return 0;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortUsageRows(rows: UsageEventDto[]): UsageEventDto[] {
  return [...rows].sort((left, right) => timeValue(right) - timeValue(left));
}

function normalizeDirectUsageResponse(
  json: unknown,
  page: UsageEventsPageRequest,
  label: string
): UsageEventsPageDto {
  const root = isRecord(json) ? json : {};
  const data = isRecord(root.data) ? root.data : root.data;
  const dataRecord = isRecord(data) ? data : {};
  const rows = firstArray(...directUsageArrayCandidates(root, dataRecord), data);

  if (rows === null && !hasDirectUsageSnapshot(root, dataRecord)) {
    throw new AipUpstreamShapeError(`${label} returned JSON without usage rows`);
  }

  const normalizedRows = rows === null || rows.length === 0
    ? [directSnapshotRow(root, dataRecord)]
    : withDirectMetaRows(rows, root, dataRecord);
  const total = normalizedRows.length;
  const pageNumber = numberFrom(dataRecord.page ?? root.page, page.page);
  const pageSize = numberFrom(dataRecord.page_size ?? dataRecord.pageSize ?? root.page_size ?? root.pageSize, page.pageSize);
  const pages = numberFrom(dataRecord.pages ?? root.pages, Math.max(1, Math.ceil(total / Math.max(1, pageSize))));

  const parsed = UsageEventsPageDtoSchema.parse({
    items: normalizedRows,
    total,
    page: pageNumber,
    page_size: pageSize,
    pages,
  });

  return {
    ...parsed,
    items: sortUsageRows(parsed.items),
    total: normalizedRows.length,
  };
}

function normalizeOperatorHistoryResponse(
  json: unknown,
  page: UsageEventsPageRequest,
  keyFilter: string | undefined,
  label: string
): UsageEventsPageDto {
  const root = isRecord(json) ? json : {};
  const data = isRecord(root.data) ? root.data : root.data;
  const dataRecord = isRecord(data) ? data : {};
  const rows = firstArray(...directUsageArrayCandidates(root, dataRecord), data);

  if (rows === null) {
    throw new AipUpstreamShapeError(`${label} returned JSON without request rows`);
  }

  const normalizedRows = withOperatorHistoryRows(rows, keyFilter);
  const total = numberFrom(dataRecord.total ?? root.total, normalizedRows.length);
  const pageNumber = numberFrom(dataRecord.page ?? root.page, page.page);
  const pageSize = numberFrom(dataRecord.page_size ?? dataRecord.pageSize ?? root.page_size ?? root.pageSize, page.pageSize);
  const pages = numberFrom(dataRecord.pages ?? root.pages, Math.max(1, Math.ceil(total / Math.max(1, pageSize))));

  const parsed = UsageEventsPageDtoSchema.parse({
    items: normalizedRows,
    total,
    page: pageNumber,
    page_size: pageSize,
    pages,
  });

  return {
    ...parsed,
    items: sortUsageRows(parsed.items),
    total: parsed.items.length > 0 ? total : 0,
  };
}

export async function fetchUsageSummary(
  session: OperatorSession,
  range: UsageRange,
  keyFilter?: string
): Promise<UsageSummaryDto> {
  const params = rangeParams(range);
  appendKeyFilter(params, keyFilter);
  const response = await fetchUpstream(
    session,
    `/usage/stats?${params.toString()}`,
    UsageSummaryResponseSchema,
    'usage summary'
  );

  return UsageSummaryDtoSchema.parse(response.data);
}

export async function fetchUsageEvents(
  session: OperatorSession,
  range: UsageRange,
  page: UsageEventsPageRequest,
  keyFilter?: string
): Promise<UsageEventsPageDto> {
  const params = rangeParams(range);
  params.set('page', String(page.page));
  params.set('page_size', String(page.pageSize));
  params.set('sort_by', 'created_at');
  params.set('sort_order', 'desc');
  appendKeyFilter(params, keyFilter);

  let primaryResult: UsageEventsPageDto | null = null;
  let primaryError: unknown = null;

  try {
    const response = await fetchUpstream(
      session,
      `/usage?${params.toString()}`,
      UsageEventsResponseSchema,
      'usage events'
    );
    primaryResult = UsageEventsPageDtoSchema.parse(response.data);
    if (primaryResult.items.length > 0) {
      return primaryResult;
    }
  } catch (error) {
    if (error instanceof AipUpstreamError && error.status !== undefined && error.status < 500) {
      throw error;
    }
    primaryError = error;
  }

  try {
    const historyResult = await fetchOperatorHistoryEvents(session, range, page, keyFilter);
    if (historyResult.items.length > 0 || primaryResult === null) {
      return historyResult;
    }
  } catch (error) {
    if (primaryResult !== null) {
      return primaryResult;
    }
    if (primaryError !== null) {
      throw primaryError;
    }
    throw error;
  }

  return primaryResult;
}

function operatorHistoryUrls(
  range: UsageRange,
  page: UsageEventsPageRequest,
  keyFilter?: string
): URL[] {
  const params = rangeParams(range);
  params.set('page', String(page.page));
  params.set('page_size', String(page.pageSize));
  params.set('sort_by', 'created_at');
  params.set('sort_order', 'desc');
  if (keyFilter !== undefined && keyFilter !== '') {
    params.set('api_key_id', keyFilter);
    params.set('key_id', keyFilter);
    params.set('token_id', keyFilter);
    params.set('token', keyFilter);
  }

  return OPERATOR_HISTORY_PATHS.map((path) => {
    const separator = path.includes('?') ? '&' : '?';
    return operatorApiUrl(`${path}${separator}${params.toString()}`);
  });
}

async function fetchOperatorHistoryEvents(
  session: OperatorSession,
  range: UsageRange,
  page: UsageEventsPageRequest,
  keyFilter?: string
): Promise<UsageEventsPageDto> {
  let lastError: unknown = null;
  const diagnostics: Array<{ host: string; path: string; code: string }> = [];

  for (const url of operatorHistoryUrls(range, page, keyFilter)) {
    try {
      const json = await fetchUpstreamJson(session, url, 'usage history');
      const parsed = normalizeOperatorHistoryResponse(json, page, keyFilter, 'usage history');
      if (parsed.items.length > 0) {
        if (diagnostics.length > 0) {
          logOperatorHistoryDiagnostic(keyFilter, diagnostics, 'OPERATOR_HISTORY_RECOVERED');
        }
        return parsed;
      }
      lastError = new AipUpstreamShapeError('usage history returned no request rows');
      diagnostics.push({ host: url.hostname, path: url.pathname, code: 'NO_ROWS' });
    } catch (error) {
      lastError = error;
      diagnostics.push({ host: url.hostname, path: url.pathname, code: directDiagnosticCode(error) });
    }
  }

  logOperatorHistoryDiagnostic(keyFilter, diagnostics, 'OPERATOR_HISTORY_EXHAUSTED');

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new AipUpstreamShapeError('usage history returned no request rows');
}

export async function fetchDirectUsageEvents(
  plaintextKey: string,
  range: UsageRange,
  page: UsageEventsPageRequest
): Promise<UsageEventsPageDto> {
  const params = rangeParams(range);
  params.set('page', String(page.page));
  params.set('page_size', String(page.pageSize));
  params.set('sort_by', 'created_at');
  params.set('sort_order', 'desc');

  let endpointMisses = 0;
  let keyRejections = 0;
  let lastShapeError: AipUpstreamShapeError | null = null;
  let lastUpstreamError: AipUpstreamError | AipUpstreamTimeoutError | null = null;
  let snapshotResult: UsageEventsPageDto | null = null;
  const diagnostics: DirectDiagnostic[] = [];

  for (const url of directUsageUrls(params)) {
    for (const strategy of DIRECT_STRATEGIES) {
      try {
        const json = await fetchDirectUrlWithUserKey(plaintextKey, url, 'direct usage events', strategy);
        const parsed = normalizeDirectUsageResponse(json, page, 'direct usage events');
        if (directRequestRows(parsed).length > 0) {
          if (diagnostics.length > 0) {
            logDirectDiagnostic(plaintextKey, diagnostics, 'DIRECT_RECOVERED');
          }
          return parsed;
        }
        if (process.env.ROUTEAI_DIRECT_SEARCH_REQUEST_ROWS !== 'true') {
          if (diagnostics.length > 0) {
            logDirectDiagnostic(plaintextKey, diagnostics, 'DIRECT_SNAPSHOT_ONLY');
          }
          return parsed;
        }
        if (snapshotResult === null) {
          snapshotResult = parsed;
        }
        diagnostics.push({
          host: url.hostname,
          method: strategy.method,
          authMode: strategy.authMode,
          code: 'SNAPSHOT_ONLY',
        });
        continue;
      } catch (error) {
        diagnostics.push({
          host: url.hostname,
          method: strategy.method,
          authMode: strategy.authMode,
          code: directDiagnosticCode(error),
        });
        if (error instanceof AipDirectKeyRejectedError) {
          keyRejections += 1;
          continue;
        }
        if (error instanceof AipDirectEndpointUnconfirmedError) {
          endpointMisses += 1;
          continue;
        }
        if (error instanceof AipUpstreamShapeError || error instanceof z.ZodError) {
          lastShapeError = new AipUpstreamShapeError(error instanceof Error ? error.message : undefined);
          continue;
        }
        if (error instanceof AipUpstreamError || error instanceof AipUpstreamTimeoutError) {
          lastUpstreamError = error;
          continue;
        }
        throw error;
      }
    }
  }

  if (snapshotResult !== null) {
    if (diagnostics.length > 0) {
      logDirectDiagnostic(plaintextKey, diagnostics, 'DIRECT_SNAPSHOT_ONLY');
    }
    return snapshotResult;
  }

  logDirectDiagnostic(plaintextKey, diagnostics, 'DIRECT_EXHAUSTED');

  if (lastShapeError !== null) {
    throw lastShapeError;
  }

  if (lastUpstreamError !== null) {
    throw lastUpstreamError;
  }

  if (keyRejections > 0) {
    throw new AipDirectKeyRejectedError();
  }

  if (endpointMisses > 0) {
    throw new AipDirectEndpointUnconfirmedError();
  }

  throw new AipUpstreamError('direct usage events failed');
}

function directRequestRows(page: UsageEventsPageDto): UsageEventDto[] {
  return page.items.filter((row) => (row as UsageEventDto & Record<string, unknown>)._directMetaOnly !== true);
}

function directDiagnosticCode(error: unknown): string {
  if (error instanceof AipDirectKeyRejectedError) {
    return 'KEY_REJECTED';
  }
  if (error instanceof AipDirectEndpointUnconfirmedError) {
    return 'ENDPOINT_UNCONFIRMED';
  }
  if (error instanceof AipUpstreamShapeError || error instanceof z.ZodError) {
    return 'SHAPE_UNCONFIRMED';
  }
  if (error instanceof AipUpstreamTimeoutError) {
    return 'TIMEOUT';
  }
  if (error instanceof AipUpstreamError) {
    return error.status !== undefined ? `HTTP_${error.status}` : 'UPSTREAM';
  }
  return 'UNKNOWN';
}

function logDirectDiagnostic(plaintextKey: string, diagnostics: DirectDiagnostic[], code: string): void {
  if (diagnostics.length === 0) {
    return;
  }

  const tail = diagnostics.slice(-12);
  console.warn('[GudokpinLookupDiagnostic]', JSON.stringify({
    code,
    fp16: fp16(plaintextKey),
    attempts: tail,
  }));
}

function logOperatorHistoryDiagnostic(
  keyFilter: string | undefined,
  diagnostics: Array<{ host: string; path: string; code: string }>,
  code: string
): void {
  if (diagnostics.length === 0) {
    return;
  }

  const tail = diagnostics.slice(-12);
  console.warn('[GudokpinLookupDiagnostic]', JSON.stringify({
    code,
    keyFilterPresent: keyFilter !== undefined && keyFilter !== '',
    attempts: tail,
  }));
}

export async function* fetchDirectUsageEventsAll(
  plaintextKey: string,
  range: UsageRange
): AsyncIterable<UsageEventDto> {
  const pageSize = 100;
  let page = 1;

  while (true) {
    const result = await fetchDirectUsageEvents(plaintextKey, range, { page, pageSize });
    for (const item of result.items) {
      yield item;
    }

    if (page >= result.pages || result.items.length === 0) {
      break;
    }

    page += 1;
  }
}

export async function* fetchUsageEventsAll(
  session: OperatorSession,
  range: UsageRange,
  keyFilter?: string
): AsyncIterable<UsageEventDto> {
  const pageSize = 100;
  let page = 1;

  while (true) {
    const result = await fetchUsageEvents(session, range, { page, pageSize }, keyFilter);
    for (const item of result.items) {
      yield item;
    }

    if (page >= result.pages || result.items.length === 0) {
      break;
    }

    page += 1;
  }
}

export async function listAccountKeys(session: OperatorSession): Promise<AccountKeyDto[]> {
  const params = new URLSearchParams({
    page: '1',
    page_size: '100',
    timezone: 'Asia/Seoul',
  });

  const response = await fetchUpstream(
    session,
    `/keys?${params.toString()}`,
    AccountKeysResponseSchema,
    'account keys'
  );

  return response.data.items.map((item) => AccountKeyDtoSchema.parse(item));
}

export function getRouteAiProxyMode(): 'operator' | 'direct' {
  if (process.env.ROUTEAI_PROXY_MODE === 'operator' || process.env.ROUTEAI_PROXY_MODE === 'direct') {
    return process.env.ROUTEAI_PROXY_MODE;
  }

  const mode = process.env.ROUTEAI_AUTH_MODE ?? process.env.AIP_AUTH_MODE ?? 'login';
  const hasLogin =
    (process.env.ROUTEAI_OPERATOR_EMAIL ?? process.env.AIP_OPERATOR_EMAIL ?? '') !== '' &&
    (process.env.ROUTEAI_OPERATOR_PASSWORD ?? process.env.AIP_OPERATOR_PASSWORD ?? '') !== '';
  const hasCookie = (process.env.ROUTEAI_OPERATOR_COOKIE ?? process.env.AIP_OPERATOR_COOKIE ?? '') !== '';
  const hasToken = (process.env.ROUTEAI_API_TOKEN ?? '') !== '';
  const hasOperatorCredentials =
    mode === 'cookie' ? hasCookie : mode === 'token' ? hasToken : hasLogin;

  if (hasOperatorCredentials) {
    return 'operator';
  }

  return 'direct';
}

export function getRouteAiDashboardApiBaseForTests(): string {
  return getOperatorConfig().dashboardApiBase ?? ROUTEAI_DASHBOARD_API_BASE;
}
