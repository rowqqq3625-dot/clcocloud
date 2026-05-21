import 'server-only';

import { z } from 'zod';
import { VISIBLE_COLUMNS } from '../../config/columns';
import { fingerprint, fp16 } from '../keys/fingerprint';
import {
  AipInvalidKeyFormatError,
  isValidUserKeyFormat,
  resolveUserKey,
} from '../keys/registry';
import { RateLimiter } from '../rateLimit';
import { AipSessionExpiredError, operatorSessionService } from '../session';
import {
  hasUsageLedger,
  readLedgerCredit,
  readLedgerUsageRows,
  syncUsageLedgerFromRows,
} from '../ledger';
import {
  AipDirectEndpointUnconfirmedError,
  AipDirectKeyRejectedError,
  AipUpstreamShapeError,
  fetchDirectUsageEventsAll,
  fetchUsageEventsAll,
  getRouteAiProxyMode,
  listAccountKeys,
} from '../upstream/client';
import type { UsageEventDto } from '../upstream/types';
import { logAudit as defaultLogAudit } from '../audit';
import { assertAllRowsBelongToKey, filterEventsForKey } from '../filter/isolate';
import { aggregateUsage } from './aggregate';
import {
  clearAdminSessionCookie,
  createAdminSessionCookie,
  hasValidAdminSession,
  verifyAdminCode,
} from './adminAuth';
import { pickColumns } from './columns';
import { eventsToCsv } from './csv';
import { AipOperatorConfigMissingError, mapRouteError, publicError } from './errors';
import { listLowBalanceRecords, notifyLowBalanceIfNeeded } from './lowBalanceAlert';
import { rangeLabel, resolveRange } from './range';
import type {
  AipDashboardRouter,
  AipRouteDeps,
  CreditSummary,
  CsvRouteResponse,
  LookupRange,
  RouteRequest,
  RouteResponse,
  SummaryResponseBody,
} from './types';

const rangeSchema = z.union([
  z.enum(['today', '7d', '30d']),
  z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    timezone: z.string().optional(),
  }),
]);

const summaryBodySchema = z.object({
  apiKey: z.string(),
  range: rangeSchema,
});

const eventsBodySchema = z.object({
  apiKey: z.string(),
  range: rangeSchema,
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(500).default(10),
});

const exportBodySchema = z.object({
  apiKey: z.string(),
  range: rangeSchema,
});

const adminLoginBodySchema = z.object({
  code: z.string().min(1).max(256),
});

const noStoreHeaders = {
  'Cache-Control': 'no-store',
};
const MAX_RECENT_USAGE_ROWS = 30;
const EVENTS_CACHE_TTL_MS = 2_000;

function getSeededRandom(seedStr: string): () => number {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function generateMockRequestRows(identifierForRows: string, range: LookupRange): UsageEventDto[] {
  const seedStr = `${identifierForRows}-${rangeLabel(range)}`;
  const seededRandom = getSeededRandom(seedStr);

  const resolved = resolveRange(range);
  const startMs = Date.parse(resolved.startDate + 'T00:00:00Z');
  const endMs = Date.parse(resolved.endDate + 'T23:59:59Z');
  const span = endMs - startMs;

  const models = [
    'claude-3-5-sonnet',
    'claude-3-opus',
    'claude-3-haiku',
  ];

  const rows: UsageEventDto[] = [];
  for (let i = 0; i < 60; i++) {
    const fraction = i / 59;
    const randomOffset = seededRandom();
    const timeOffset = fraction * span + (randomOffset - 0.5) * (span / 60);
    const rowTimeMs = startMs + Math.max(0, Math.min(span, timeOffset));
    const created_at = new Date(rowTimeMs).toISOString();

    const model = models[Math.floor(seededRandom() * models.length)];
    const input_tokens = Math.floor(500 + seededRandom() * 4500);
    const output_tokens = Math.floor(100 + seededRandom() * 1900);
    const total_tokens = input_tokens + output_tokens;

    let cost = 0.000015 * input_tokens + 0.000075 * output_tokens;
    if (model.includes('haiku') || model.includes('mini')) {
      cost = 0.000003 * input_tokens + 0.000015 * output_tokens;
    } else if (model.includes('opus')) {
      cost = 0.000045 * input_tokens + 0.000225 * output_tokens;
    }
    cost = Math.round(cost * 100000) / 100000;

    const isReasoning = model.includes('reasoner') || seededRandom() > 0.8;
    const reasoningLabel = isReasoning
      ? ['high', 'medium', 'low'][Math.floor(seededRandom() * 3)]
      : '기본값';

    rows.push({
      keyIdentifier: identifierForRows,
      model,
      input_tokens,
      output_tokens,
      total_tokens,
      cost,
      actual_cost: cost,
      duration_ms: Math.floor(300 + seededRandom() * 2700),
      created_at,
      reasoningLabel,
      status: '성공',
    } as any);
  }

  return rows.sort((a, b) => {
    const timeA = a.created_at ? Date.parse(a.created_at) : 0;
    const timeB = b.created_at ? Date.parse(b.created_at) : 0;
    return timeB - timeA;
  });
}

function defaultDeps(): AipRouteDeps {
  return {
    getOperatorSession: () => operatorSessionService.getSession(),
    getProxyMode: getRouteAiProxyMode,
    resolveUserKey,
    fetchUsageEventsAll,
    fetchDirectUsageEventsAll,
    listAccountKeys,
    logAudit: (entry) => defaultLogAudit({
      timestamp: entry.ts,
      requestId: entry.requestId,
      fingerprint: entry.fp16,
      range: entry.range,
      rowCount: entry.rowCount,
      latencyMs: entry.latencyMs,
    }),
    alertSecurity: async (message) => {
      const webhookUrl = process.env.ALERT_WEBHOOK_URL;
      if (webhookUrl === undefined || webhookUrl === '') {
        return;
      }

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: 'clcocloud-api-dashboard',
          type: 'KEY_ISOLATION_ASSERTION',
          message,
          timestamp: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(5_000),
      }).catch(() => undefined);
    },
  };
}

function json(status: number, body: unknown, headers: Record<string, string> = {}): RouteResponse {
  return {
    status,
    headers: {
      ...noStoreHeaders,
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
    },
    body,
  };
}

async function collectAsync(iterable: AsyncIterable<UsageEventDto>): Promise<UsageEventDto[]> {
  const rows: UsageEventDto[] = [];
  for await (const row of iterable) {
    rows.push(row);
  }

  return rows;
}

async function ctxForDirectRows(
  apiKey: string,
  rows: UsageEventDto[],
  fallback: Awaited<ReturnType<typeof resolveUserKey>>,
  alertSecurity: (message: string) => Promise<void>
): Promise<Awaited<ReturnType<typeof resolveUserKey>>> {
  if (rows.length === 0) {
    return fallback;
  }

  const identifiers = Array.from(new Set(rows.map((row) => row.keyIdentifier)));
  if (identifiers.length !== 1 || identifiers[0] === undefined || identifiers[0] === '') {
    await alertSecurity(`Direct key response contained mixed key identifiers for ${fp16(apiKey)}`);
    throw new Error('Direct key response contained mixed key identifiers');
  }

  return {
    ...fallback,
    identifierForRows: identifiers[0],
    accountKeyMeta: directAccountKeyMeta(rows[0], fallback.accountKeyMeta),
  };
}

function directAccountKeyMeta(
  row: UsageEventDto | undefined,
  fallback: Awaited<ReturnType<typeof resolveUserKey>>['accountKeyMeta']
): Awaited<ReturnType<typeof resolveUserKey>>['accountKeyMeta'] {
  const meta = row as (UsageEventDto & Record<string, unknown>) | undefined;
  if (meta === undefined) {
    return fallback;
  }

  return {
    ...fallback,
    status: typeof meta.direct_status === 'string' ? meta.direct_status : fallback.status,
    quota: numberOrNull(meta.direct_quota) ?? fallback.quota,
    quota_used: numberOrNull(meta.direct_quota_used) ?? fallback.quota_used,
    remaining: numberOrNull(meta.direct_remaining) ?? fallback.remaining,
    balance: numberOrNull(meta.direct_balance) ?? fallback.balance,
    used_amount: numberOrNull(meta.direct_used_amount) ?? fallback.used_amount,
    total_amount: numberOrNull(meta.direct_total_amount) ?? fallback.total_amount,
    initial_amount: numberOrNull(meta.direct_initial_amount) ?? fallback.initial_amount,
    baseline_amount: numberOrNull(meta.direct_baseline_amount) ?? fallback.baseline_amount,
    last_used_at: typeof meta.direct_last_used_at === 'string' ? meta.direct_last_used_at : fallback.last_used_at,
  };
}

function mergeDirectAccountKeyMeta(
  directCtx: Awaited<ReturnType<typeof resolveUserKey>> | null,
  operatorCtx: Awaited<ReturnType<typeof resolveUserKey>>
): Awaited<ReturnType<typeof resolveUserKey>> {
  if (directCtx === null) {
    return operatorCtx;
  }

  return {
    ...operatorCtx,
    accountKeyMeta: {
      ...operatorCtx.accountKeyMeta,
      status: directCtx.accountKeyMeta.status ?? operatorCtx.accountKeyMeta.status,
      quota: directCtx.accountKeyMeta.quota ?? operatorCtx.accountKeyMeta.quota,
      quota_used: directCtx.accountKeyMeta.quota_used ?? operatorCtx.accountKeyMeta.quota_used,
      remaining: directCtx.accountKeyMeta.remaining ?? operatorCtx.accountKeyMeta.remaining,
      remaining_balance: directCtx.accountKeyMeta.remaining_balance ?? operatorCtx.accountKeyMeta.remaining_balance,
      balance: directCtx.accountKeyMeta.balance ?? operatorCtx.accountKeyMeta.balance,
      used_amount: directCtx.accountKeyMeta.used_amount ?? operatorCtx.accountKeyMeta.used_amount,
      total_amount: directCtx.accountKeyMeta.total_amount ?? operatorCtx.accountKeyMeta.total_amount,
      initial_amount: directCtx.accountKeyMeta.initial_amount ?? operatorCtx.accountKeyMeta.initial_amount,
      baseline_amount: directCtx.accountKeyMeta.baseline_amount ?? operatorCtx.accountKeyMeta.baseline_amount,
      last_used_at: directCtx.accountKeyMeta.last_used_at ?? operatorCtx.accountKeyMeta.last_used_at,
    },
  };
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getHeader(request: RouteRequest, name: string): string | undefined {
  const lower = name.toLowerCase();
  const headers = request.headers ?? {};

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lower) {
      return Array.isArray(value) ? value[0] : value;
    }
  }

  return undefined;
}

function clientIp(request: RouteRequest): string {
  const forwarded = getHeader(request, 'x-forwarded-for');
  if (forwarded !== undefined && forwarded !== '') {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }

  return request.ip ?? 'unknown';
}

function paginate<T>(rows: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

function timeValue(row: UsageEventDto): number {
  const value = row.created_at;
  if (value === undefined || value === '') {
    return 0;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function recentFirst(rows: UsageEventDto[]): UsageEventDto[] {
  return [...rows].sort((left, right) => timeValue(right) - timeValue(left));
}

function recordValue(row: UsageEventDto, key: string): unknown {
  return (row as UsageEventDto & Record<string, unknown>)[key];
}

function nestedRecordValue(row: UsageEventDto, key: string): Record<string, unknown> {
  const value = recordValue(row, key);
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' ? value.trim() : null;
}

function isSlashCommandUsage(row: UsageEventDto): boolean {
  return false;
}

function isDirectMetaOnlyUsage(row: UsageEventDto): boolean {
  return (row as UsageEventDto & Record<string, unknown>)._directMetaOnly === true;
}

function realRequestRowCount(rows: UsageEventDto[]): number {
  return rows.filter((row) => !isDirectMetaOnlyUsage(row) && !isSlashCommandUsage(row)).length;
}

function eventsPage(page: number): number {
  return Math.min(Math.max(page, 1), 3);
}

function eventsPageSize(pageSize: number): number {
  return Math.min(Math.max(pageSize, 1), 10);
}

function hasOperatorCredentialEnv(): boolean {
  const mode = process.env.ROUTEAI_AUTH_MODE ?? process.env.AIP_AUTH_MODE ?? 'login';
  const hasLogin =
    (process.env.ROUTEAI_OPERATOR_EMAIL ?? process.env.AIP_OPERATOR_EMAIL ?? '') !== '' &&
    (process.env.ROUTEAI_OPERATOR_PASSWORD ?? process.env.AIP_OPERATOR_PASSWORD ?? '') !== '';
  const hasCookie = (process.env.ROUTEAI_OPERATOR_COOKIE ?? process.env.AIP_OPERATOR_COOKIE ?? '') !== '';
  const hasToken = (process.env.ROUTEAI_API_TOKEN ?? '') !== '';

  if (mode === 'cookie') {
    return hasCookie;
  }
  if (mode === 'token') {
    return hasToken;
  }
  return hasLogin;
}

function shouldTryOperatorFallback(error: unknown): boolean {
  const name = error instanceof Error ? error.name : '';
  return (
    error instanceof AipDirectKeyRejectedError ||
    error instanceof AipDirectEndpointUnconfirmedError ||
    error instanceof AipUpstreamShapeError ||
    name === 'AipDirectKeyRejectedError' ||
    name === 'AipDirectEndpointUnconfirmedError' ||
    name === 'AipUpstreamShapeError'
  );
}

function logLookupDiagnostic(code: string, apiKey: string): void {
  console.warn('[GudokpinLookupDiagnostic]', JSON.stringify({
    code,
    fp16: fp16(apiKey),
  }));
}

function logRowDiagnostic(apiKey: string, rows: UsageEventDto[], requestRows: UsageEventDto[]): void {
  if (requestRows.length > 0) {
    return;
  }

  console.warn('[GudokpinLookupDiagnostic]', JSON.stringify({
    code: 'NO_USAGE_ROWS_FROM_UPSTREAM',
    fp16: fp16(apiKey),
    normalizedRows: rows.length,
    requestRows: requestRows.length,
    directMetaRows: rows.filter(isDirectMetaOnlyUsage).length,
  }));
}

function keyContextWithLedgerCredit(
  ctx: Awaited<ReturnType<typeof resolveUserKey>>,
  credit: CreditSummary | null
): Awaited<ReturnType<typeof resolveUserKey>> {
  if (credit === null) {
    return ctx;
  }

  return {
    ...ctx,
    accountKeyMeta: {
      ...ctx.accountKeyMeta,
      remaining: credit.remainingUsd,
      remaining_balance: credit.remainingUsd,
      balance: credit.remainingUsd,
      used_amount: credit.usedUsd,
      total_amount: credit.limitUsd,
      initial_amount: credit.initialUsd,
      baseline_amount: credit.baselineUsd,
      last_used_at: credit.lastUsedAt,
    },
  };
}

function isSessionExpired(error: unknown): boolean {
  const name = error instanceof Error ? error.name : '';
  return error instanceof AipSessionExpiredError || name === 'AipSessionExpiredError';
}

function routeError(error: unknown): RouteResponse {
  const mapped = mapRouteError(error);
  return json(mapped.status, {
    error: {
      code: mapped.code,
      message: mapped.message,
    },
  });
}

function badRequest(): RouteResponse {
  const mapped = publicError(400, 'BAD_REQUEST');
  return json(400, {
    error: {
      code: mapped.code,
      message: mapped.message,
    },
  });
}

function rateLimited(retryAfter: number): RouteResponse {
  const mapped = publicError(429, 'RATE_LIMITED');
  return json(
    429,
    {
      error: {
        code: mapped.code,
        message: mapped.message,
      },
    },
    {
      'Retry-After': String(retryAfter),
    }
  );
}

function newRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

interface EventsResponseBody {
  rows: Record<string, string | number | null>[];
  total: number;
  page: number;
  pageSize: number;
  credit: CreditSummary;
  summary: Pick<SummaryResponseBody, 'requests' | 'tokensIn' | 'tokensOut' | 'costUsd' | 'actualCostUsd'>;
  syncing?: boolean;
}

interface EventsCacheEntry {
  body: EventsResponseBody;
  expiresAt: number;
}

function unknownCredit(source = 'syncing'): CreditSummary {
  return {
    remainingUsd: null,
    usedUsd: null,
    limitUsd: null,
    initialUsd: null,
    baselineUsd: null,
    percentUsed: null,
    status: null,
    source,
    lastUsedAt: null,
  };
}

function emptyEventsBody(page: number, pageSize: number): EventsResponseBody {
  return {
    rows: [],
    total: 0,
    page,
    pageSize,
    credit: unknownCredit(),
    summary: {
      requests: 0,
      tokensIn: 0,
      tokensOut: 0,
      costUsd: 0,
      actualCostUsd: 0,
    },
    syncing: true,
  };
}

function staleEventsBody(body: EventsResponseBody): EventsResponseBody {
  return {
    ...body,
    syncing: true,
  };
}

function eventsCacheKey(apiKey: string, range: LookupRange, page: number, pageSize: number): string | null {
  if (!isValidUserKeyFormat(apiKey)) {
    return null;
  }

  return JSON.stringify({
    fp: fingerprint(apiKey),
    range,
    page,
    pageSize,
  });
}

export function createAipDashboardRouter(deps: Partial<AipRouteDeps> = {}): AipDashboardRouter {
  const hasInjectedDeps = Object.keys(deps).length > 0;
  const resolvedDeps: AipRouteDeps = {
    ...defaultDeps(),
    ...deps,
    getProxyMode: deps.getProxyMode ?? (hasInjectedDeps ? (() => 'operator') : getRouteAiProxyMode),
  };
  const rateLimiter = new RateLimiter();
  const adminLoginLimiter = new RateLimiter(60_000);
  const eventsCache = new Map<string, EventsCacheEntry>();
  const eventsInFlight = new Map<string, Promise<RouteResponse>>();

  function cachedEvents(cacheKey: string, includeExpired = false): EventsResponseBody | null {
    const entry = eventsCache.get(cacheKey);
    if (entry === undefined) {
      return null;
    }
    if (!includeExpired && entry.expiresAt <= Date.now()) {
      return null;
    }
    return entry.body;
  }

  function setEventsCache(cacheKey: string, body: EventsResponseBody): void {
    eventsCache.set(cacheKey, {
      body,
      expiresAt: Date.now() + EVENTS_CACHE_TTL_MS,
    });
  }

  async function runLookup(
    apiKey: string,
    range: LookupRange,
    request: RouteRequest
  ): Promise<{
    rows: UsageEventDto[];
    lookupRange: ReturnType<typeof resolveRange>;
    ctxFp16: string;
    lastFour: string;
    identifierForRows: string;
    ctx: Awaited<ReturnType<typeof resolveUserKey>>;
  }> {
    if (!isValidUserKeyFormat(apiKey)) {
      throw new AipInvalidKeyFormatError();
    }

    const lookupRange = resolveRange(range);

    let ctx: Awaited<ReturnType<typeof resolveUserKey>> | null = null;
    let allRows: UsageEventDto[] | null = null;

    async function runOperatorLookup(retried = false): Promise<{
      ctx: Awaited<ReturnType<typeof resolveUserKey>>;
      rows: UsageEventDto[];
    }> {
      try {
        const session = await resolvedDeps.getOperatorSession();
        const operatorCtx = await resolvedDeps.resolveUserKey(apiKey, session);
        const operatorRows = await collectAsync(
          resolvedDeps.fetchUsageEventsAll(session, lookupRange, operatorCtx.identifierForRows)
        );
        return { ctx: operatorCtx, rows: operatorRows };
      } catch (error) {
        if (!retried && isSessionExpired(error)) {
          if (!hasInjectedDeps) {
            await operatorSessionService.handleUnauthorized();
          }
          return runOperatorLookup(true);
        }
        throw error;
      }
    }

    if (resolvedDeps.getProxyMode() === 'direct') {
      let directCtx: Awaited<ReturnType<typeof resolveUserKey>> | null = null;
      let directRows: UsageEventDto[] | null = null;
      let directError: unknown = null;

      try {
        const fallbackCtx = await resolvedDeps.resolveUserKey(apiKey);
        directRows = await collectAsync(resolvedDeps.fetchDirectUsageEventsAll(apiKey, lookupRange));
        directCtx = await ctxForDirectRows(apiKey, directRows, fallbackCtx, resolvedDeps.alertSecurity);
      } catch (error) {
        directError = error;
        if (!shouldTryOperatorFallback(error)) {
          throw error;
        }
      }

      if (hasOperatorCredentialEnv()) {
        try {
          const operatorResult = await runOperatorLookup();
          const directRequestCount = directRows === null ? 0 : realRequestRowCount(directRows);
          const operatorRequestCount = realRequestRowCount(operatorResult.rows);
          if (directRows !== null && directCtx !== null && directRequestCount > operatorRequestCount) {
            ctx = directCtx;
            allRows = directRows;
          } else {
            ctx = mergeDirectAccountKeyMeta(directCtx, operatorResult.ctx);
            allRows = operatorResult.rows;
          }
        } catch (operatorError) {
          if (directRows !== null && directCtx !== null) {
            ctx = directCtx;
            allRows = directRows;
          } else {
            throw operatorError;
          }
        }
      } else if (directRows !== null && directCtx !== null) {
        ctx = directCtx;
        allRows = directRows;
      } else {
        if (directError !== null) {
          logLookupDiagnostic('NO_OPERATOR_FALLBACK', apiKey);
          throw directError;
        }
        if (!hasOperatorCredentialEnv()) {
          logLookupDiagnostic('NO_OPERATOR_FALLBACK', apiKey);
          throw new AipOperatorConfigMissingError();
        }
      }
    } else {
      if (!hasInjectedDeps && !hasOperatorCredentialEnv()) {
        throw new AipOperatorConfigMissingError();
      }
      const operatorResult = await runOperatorLookup();
      ctx = operatorResult.ctx;
      allRows = operatorResult.rows;
    }
    if (ctx === null || allRows === null) {
      throw new Error('Lookup pipeline did not produce an isolated result');
    }
    let filtered = filterEventsForKey(allRows, ctx);
    try {
      assertAllRowsBelongToKey(filtered, ctx);
    } catch (error) {
      await resolvedDeps.alertSecurity(
        `Key isolation invariant failed for ${fp16(apiKey)}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`
      );
      throw error;
    }

    if (hasUsageLedger()) {
      const ledgerKey = fingerprint(apiKey);
      const ledgerCreditBeforeSync = aggregateUsage(filtered, ctx).credit;
      await syncUsageLedgerFromRows(ledgerKey, filtered, ledgerCreditBeforeSync).catch((error) => {
        console.warn('[GudokpinLookupDiagnostic]', JSON.stringify({
          code: 'LEDGER_SYNC_FAILED',
          fp16: fp16(apiKey),
          reason: error instanceof Error ? error.name : 'unknown',
        }));
      });
      const [ledgerRows, ledgerCredit] = await Promise.all([
        readLedgerUsageRows(ledgerKey, MAX_RECENT_USAGE_ROWS, ctx.identifierForRows).catch(() => []),
        readLedgerCredit(ledgerKey).catch(() => null),
      ]);
      if (ledgerRows.length > 0) {
        filtered = ledgerRows;
      }
      ctx = keyContextWithLedgerCredit(ctx, ledgerCredit);
    }

    return {
      rows: filtered.filter((row) => !isSlashCommandUsage(row)),
      lookupRange,
      ctxFp16: fp16(apiKey),
      lastFour: ctx.lastFour,
      identifierForRows: ctx.identifierForRows,
      ctx,
    };
  }

  async function summary(request: RouteRequest): Promise<RouteResponse> {
    const startedAt = Date.now();
    const requestId = newRequestId();
    const parsed = summaryBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return badRequest();
    }

    const ip = clientIp(request);
    const rate = rateLimiter.check(ip, parsed.data.apiKey);
    if (!rate.allowed) {
      return rateLimited(rate.retryAfter);
    }

    try {
      const result = await runLookup(parsed.data.apiKey, parsed.data.range, request);
      const body = aggregateUsage(result.rows, result.ctx);
      await notifyLowBalanceIfNeeded({ credit: body.credit, ctx: result.ctx });
      resolvedDeps.logAudit({
        requestId,
        ts: new Date().toISOString(),
        ip,
        fp16: result.ctxFp16,
        range: rangeLabel(parsed.data.range),
        rowCount: result.rows.length,
        latencyMs: Date.now() - startedAt,
      });
      return json(200, body);
    } catch (error) {
      return routeError(error);
    }
  }

  async function events(request: RouteRequest): Promise<RouteResponse> {
    const startedAt = Date.now();
    const requestId = newRequestId();
    const parsed = eventsBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return badRequest();
    }

    const page = eventsPage(parsed.data.page);
    const pageSize = eventsPageSize(parsed.data.pageSize);
    const cacheKey = eventsCacheKey(
      parsed.data.apiKey,
      parsed.data.range,
      page,
      pageSize
    );
    if (cacheKey === null) {
      return json(200, emptyEventsBody(page, pageSize));
    }

    const freshCached = cachedEvents(cacheKey);
    if (freshCached !== null) {
      return json(200, freshCached);
    }

    const inFlight = eventsInFlight.get(cacheKey);
    if (inFlight !== undefined) {
      return inFlight;
    }

    const ip = clientIp(request);
    const rate = rateLimiter.check(ip, parsed.data.apiKey);
    if (!rate.allowed) {
      return json(
        200,
        cachedEvents(cacheKey, true) ?? emptyEventsBody(page, pageSize)
      );
    }

    const lookupPromise = (async (): Promise<RouteResponse> => {
      try {
        const result = await runLookup(parsed.data.apiKey, parsed.data.range, request);
        const requestRows = result.rows.filter((row) => !isDirectMetaOnlyUsage(row));
        logRowDiagnostic(parsed.data.apiKey, result.rows, requestRows);
        const recentRows = recentFirst(requestRows).slice(0, MAX_RECENT_USAGE_ROWS);
        const visible = pickColumns(recentRows, VISIBLE_COLUMNS);
        const pageRows = paginate(visible, page, pageSize);
        const aggregate = aggregateUsage(result.rows, result.ctx);
        await notifyLowBalanceIfNeeded({ credit: aggregate.credit, ctx: result.ctx });
        const body: EventsResponseBody = {
          rows: pageRows,
          total: visible.length,
          page,
          pageSize,
          credit: aggregate.credit,
          summary: {
            requests: aggregate.requests,
            tokensIn: aggregate.tokensIn,
            tokensOut: aggregate.tokensOut,
            costUsd: aggregate.costUsd,
            actualCostUsd: aggregate.actualCostUsd,
          },
        };

      resolvedDeps.logAudit({
        requestId,
        ts: new Date().toISOString(),
        ip,
        fp16: result.ctxFp16,
        range: rangeLabel(parsed.data.range),
        rowCount: pageRows.length,
        latencyMs: Date.now() - startedAt,
      });

        setEventsCache(cacheKey, body);
        return json(200, body);
      } catch {
        const stale = cachedEvents(cacheKey, true);
        return json(
          200,
          stale !== null
            ? staleEventsBody(stale)
            : emptyEventsBody(page, pageSize)
        );
      } finally {
        eventsInFlight.delete(cacheKey);
      }
    })();

    eventsInFlight.set(cacheKey, lookupPromise);
    return lookupPromise;
  }

  async function exportCsv(request: RouteRequest): Promise<CsvRouteResponse | RouteResponse> {
    const startedAt = Date.now();
    const requestId = newRequestId();
    const parsed = exportBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return badRequest();
    }

    const ip = clientIp(request);
    const rate = rateLimiter.check(ip, parsed.data.apiKey);
    if (!rate.allowed) {
      return rateLimited(rate.retryAfter);
    }

    try {
      const result = await runLookup(parsed.data.apiKey, parsed.data.range, request);
      const requestRows = result.rows.filter((row) => !isDirectMetaOnlyUsage(row));
      assertAllRowsBelongToKey(requestRows, {
        fingerprint: '',
        identifierForRows: result.identifierForRows,
        lastFour: result.lastFour,
        accountKeyMeta: { id: 0, status: 'active' },
      });
      const filename = `clcocloud-usage-${rangeLabel(parsed.data.range)}-${result.lastFour}.csv`;

      resolvedDeps.logAudit({
        requestId,
        ts: new Date().toISOString(),
        ip,
        fp16: result.ctxFp16,
        range: rangeLabel(parsed.data.range),
        rowCount: requestRows.length,
        latencyMs: Date.now() - startedAt,
      });

      return {
        status: 200,
        headers: {
          ...noStoreHeaders,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
        body: eventsToCsv(requestRows, VISIBLE_COLUMNS),
      };
    } catch (error) {
      return routeError(error);
    }
  }

  async function health(request: RouteRequest): Promise<RouteResponse> {
    const adminToken = process.env.ADMIN_TOKEN ?? '';
    if (adminToken === '' || getHeader(request, 'x-admin-token') !== adminToken) {
      return json(401, { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } });
    }

    return json(200, operatorSessionService.getHealth());
  }

  async function adminLogin(request: RouteRequest): Promise<RouteResponse> {
    const parsed = adminLoginBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return json(401, { ok: false });
    }

    const ip = clientIp(request);
    const rate = adminLoginLimiter.check(`admin:${ip}`);
    if (!rate.allowed) {
      return json(401, { ok: false });
    }

    if (!verifyAdminCode(parsed.data.code)) {
      return json(401, { ok: false });
    }

    return json(
      200,
      { ok: true },
      {
        'Set-Cookie': createAdminSessionCookie(),
      }
    );
  }

  async function adminLogout(): Promise<RouteResponse> {
    return json(
      200,
      { ok: true },
      {
        'Set-Cookie': clearAdminSessionCookie(),
      }
    );
  }

  async function adminLowBalance(request: RouteRequest): Promise<RouteResponse> {
    if (!hasValidAdminSession(getHeader(request, 'cookie'))) {
      return json(401, { ok: false });
    }

    return json(200, {
      ok: true,
      records: listLowBalanceRecords(),
    });
  }

  return {
    async handle(request: RouteRequest): Promise<RouteResponse> {
      if (request.method === 'POST' && request.path === '/lookup/summary') {
        return summary(request);
      }

      if (request.method === 'POST' && request.path === '/lookup/events') {
        return events(request);
      }

      if (request.method === 'POST' && request.path === '/lookup/export') {
        return exportCsv(request);
      }

      if (request.method === 'GET' && request.path === '/admin/session/health') {
        return health(request);
      }

      if (request.method === 'POST' && request.path === '/admin/login') {
        return adminLogin(request);
      }

      if (request.method === 'POST' && request.path === '/admin/logout') {
        return adminLogout();
      }

      if (request.method === 'GET' && request.path === '/admin/low-balance') {
        return adminLowBalance(request);
      }

      return json(404, { error: { code: 'NOT_FOUND', message: 'Not found' } });
    },
  };
}
