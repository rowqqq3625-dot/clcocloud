import 'server-only';

import { createHash, randomUUID } from 'crypto';
import type { PoolClient, QueryResultRow } from 'pg';
import type { UsageEventDto } from '../upstream/types';
import { UsageEventDtoSchema } from '../upstream/types';
import type { CreditSummary } from '../routes/types';
import { isLedgerEnabled, numberFromDb, withLedgerClient, withLedgerTransaction } from './db';
import { fingerprint, fp16 } from '../keys/fingerprint';

export interface LedgerUsageInput {
  fp_full: string;
  fp16: string;
  last4: string;
  requestId: string;
  model: string;
  reasoningEffort?: string | null;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  requestSource: 'user_prompt' | 'slash_command' | 'system';
  occurredAt: string | null;
  upstreamSource: 'direct' | 'operator' | 'webhook';
  rawPayloadHash: string;
  durationMs?: number | null;
  statusCode?: number | null;
  statusReason?: string | null;
}

interface LedgerUsageRow extends QueryResultRow {
  fp_full: string;
  fp16: string;
  last4: string;
  request_id: string;
  model: string;
  reasoning_effort: string | null;
  input_tokens: number;
  output_tokens: number;
  cost_usd: string | number;
  request_source: string;
  occurred_at: string | Date | null;
  duration_ms: number | null;
  status_code: number | null;
  status_reason: string | null;
}

interface LedgerBalanceRow extends QueryResultRow {
  initial_balance_usd: string | number;
  last_topup_balance_usd: string | number;
  current_balance_usd: string | number;
  updated_at: string | Date;
}

export function hasUsageLedger(): boolean {
  return isLedgerEnabled();
}

/**
 * 4-2. snapshot/summary 판별 규칙
 * snapshot/summary로 분류된 row는 true를 반환하여 폐기합니다.
 */
export function isSnapshotOrSummaryRow(row: UsageEventDto): boolean {
  const model = (row.model ?? '').toLowerCase();
  
  // 1. 모델명에 stats, summary, aggregate, total, breakdown, model_stats, per_model, daily, hourly 등이 포함된 경우
  const blacklist = [
    'stats', 'summary', 'aggregate', 'total', 'breakdown', 
    'model_stats', 'per_model', 'daily', 'hourly'
  ];
  if (blacklist.some(term => model.includes(term))) {
    return true;
  }

  // 2. request_id가 없는 row
  const record = row as UsageEventDto & Record<string, unknown>;
  const requestId = 
    stringValue(record.request_id) ??
    stringValue(record.requestId) ??
    stringValue(record.id) ??
    stringValue(record.message_id) ??
    stringValue(record.messageId);
  if (!requestId) {
    return true;
  }

  // 3. input_tokens와 output_tokens가 동시에 null/0 이하이고 cost도 null/0 이하인 row
  const input = positiveInteger(row.input_tokens);
  const output = positiveInteger(row.output_tokens);
  const cost = numeric(row.actual_cost ?? row.cost);
  if (input <= 0 && output <= 0 && cost <= 0) {
    return true;
  }

  // 4. 시간 키가 전혀 없는데 수량 값이 천 단위 합산처럼 보이는 row
  const occurredAt = parseOccurredAt(row);
  const total = positiveInteger(row.total_tokens ?? (input + output));
  if (occurredAt === null && total >= 1000) {
    return true;
  }

  return false;
}

/**
 * 4-3. 시간 정규화 및 파싱 헬퍼
 * 다양한 시간 후보들을 점검하고 정형화된 ISO String 또는 null을 반환합니다.
 */
export function parseOccurredAt(row: UsageEventDto): string | null {
  const record = row as UsageEventDto & Record<string, unknown>;
  const candidates = [
    record.created_at,
    record.createdAt,
    record.timestamp,
    record.time,
    record.date,
    record.request_time,
    record.requestTime,
    record.started_at,
    record.startedAt,
    record.completed_at,
    record.completedAt,
  ];

  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) {
      continue;
    }

    // 숫자 타임스탬프인 경우 (초 / 밀리초 판별)
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      if (candidate < 10000000000) {
        // 초 단위를 밀리초 단위로 변환
        return new Date(candidate * 1000).toISOString();
      }
      return new Date(candidate).toISOString();
    }

    // 문자열인 경우
    if (typeof candidate === 'string' && candidate.trim() !== '') {
      const parsed = Date.parse(candidate);
      if (!Number.isNaN(parsed)) {
        return new Date(parsed).toISOString();
      }
    }
  }

  // nested metadata.* 등 탐색
  const nestedObjects = [record.metadata, record.request, record.message, record.usage];
  for (const obj of nestedObjects) {
    if (typeof obj === 'object' && obj !== null) {
      const nested = obj as Record<string, unknown>;
      const nestedCandidates = [
        nested.created_at, nested.createdAt, nested.timestamp, nested.time, 
        nested.date, nested.started_at, nested.startedAt
      ];
      for (const nestedCandidate of nestedCandidates) {
        if (typeof nestedCandidate === 'number' && Number.isFinite(nestedCandidate)) {
          if (nestedCandidate < 10000000000) {
            return new Date(nestedCandidate * 1000).toISOString();
          }
          return new Date(nestedCandidate).toISOString();
        }
        if (typeof nestedCandidate === 'string' && nestedCandidate.trim() !== '') {
          const parsed = Date.parse(nestedCandidate);
          if (!Number.isNaN(parsed)) {
            return new Date(parsed).toISOString();
          }
        }
      }
    }
  }

  return null;
}

/**
 * 4-4. slash command 판별 헬퍼
 */
export function isSlashCommand(row: UsageEventDto): boolean {
  const record = row as UsageEventDto & Record<string, unknown>;
  const metadata = objectValue(record.metadata);
  const request = objectValue(record.request);
  
  if (metadata.is_slash_command === true || record.is_slash_command === true) {
    return true;
  }

  const model = stringValue(row.model)?.toLowerCase() ?? '';
  if (model.includes('slash') || model.includes('system')) {
    return true;
  }

  const candidates = [
    record.prompt,
    record.input,
    record.message,
    record.command,
    metadata.command,
    metadata.prompt,
    metadata.input,
    metadata.message,
    request.command,
    request.prompt,
    request.input,
    request.message,
  ];

  return candidates.some((candidate) => {
    const text = stringValue(candidate);
    return text !== null && text.startsWith('/');
  });
}

/**
 * usageInputFromRow
 */
function usageInputFromRow(
  rawApiKey: string, 
  row: UsageEventDto, 
  upstreamSource: 'direct' | 'operator' | 'webhook'
): LedgerUsageInput | null {
  const fpFull = fingerprint(rawApiKey);
  const fpShort = fp16(rawApiKey);
  const last4 = rawApiKey.slice(-4);

  const inputTokens = positiveInteger(row.input_tokens);
  const outputTokens = positiveInteger(row.output_tokens);
  const totalTokens = positiveInteger(row.total_tokens);
  const inferredOutput = outputTokens > 0 ? outputTokens : Math.max(totalTokens - inputTokens, 0);
  const costUsd = numeric(row.actual_cost ?? row.cost);

  const record = row as UsageEventDto & Record<string, unknown>;
  const explicitId =
    stringValue(record.request_id) ??
    stringValue(record.requestId) ??
    stringValue(record.id) ??
    stringValue(record.message_id) ??
    stringValue(record.messageId);

  const requestId = explicitId ?? createHash('sha256')
    .update(JSON.stringify({
      fpFull,
      model: row.model ?? '',
      createdAt: row.created_at ?? '',
      inputTokens,
      outputTokens: inferredOutput,
      cost: costUsd,
    }))
    .digest('hex');

  // raw payload hash for duplicate avoidance
  const rawPayloadHash = createHash('sha256')
    .update(JSON.stringify(row))
    .digest('hex');

  const statusCandidates = [
    record.status_code,
    record.statusCode,
    record.http_status,
    record.httpStatus,
    record.status,
  ];
  let statusCode: number | null = null;
  for (const candidate of statusCandidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      statusCode = Math.round(candidate);
      break;
    }
    if (typeof candidate === 'string') {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed) && parsed >= 100 && parsed < 600) {
        statusCode = Math.round(parsed);
        break;
      }
    }
  }
  const reasonCandidates = [
    record.status_reason,
    record.statusReason,
    record.error_message,
    record.errorMessage,
    record.error,
    record.reason,
  ];
  let statusReason: string | null = null;
  for (const candidate of reasonCandidates) {
    if (typeof candidate === 'string' && candidate.trim() !== '') {
      statusReason = candidate.trim();
      break;
    }
  }

  return {
    fp_full: fpFull,
    fp16: fpShort,
    last4,
    requestId,
    model: row.model ?? 'unknown',
    reasoningEffort: (row.reasoning_effort !== undefined && row.reasoning_effort !== null)
      ? String(row.reasoning_effort)
      : (typeof row.reasoningLabel === 'string' ? row.reasoningLabel : null),
    inputTokens,
    outputTokens: inferredOutput,
    costUsd,
    requestSource: isSlashCommand(row) ? 'slash_command' : 'user_prompt',
    occurredAt: parseOccurredAt(row),
    upstreamSource,
    rawPayloadHash,
    durationMs: typeof row.duration_ms === 'number' ? row.duration_ms : (typeof record.durationMs === 'number' ? record.durationMs : 0),
    statusCode,
    statusReason,
  };
}

/**
 * syncUsageLedgerFromRows
 * API 호출로부터 Ledger로 실제 요청 동기화 수행
 */
export async function syncUsageLedgerFromRows(
  rawApiKey: string, 
  rows: UsageEventDto[], 
  credit?: CreditSummary,
  upstreamSource: 'direct' | 'operator' | 'webhook' = 'operator'
): Promise<void> {
  if (!hasUsageLedger()) {
    return;
  }

  const fpFull = fingerprint(rawApiKey);
  const fpShort = fp16(rawApiKey);
  const last4 = rawApiKey.slice(-4);

  await withLedgerTransaction(async (client) => {
    // 1. 잔액 테이블 보정 및 upsert
    await ensureBalanceRow(client, fpFull, credit ?? null);
    await upsertBalanceSnapshot(client, fpFull, credit ?? null);

    // 2. 요청 rows 적재 (ON CONFLICT (fp_full, request_id) DO NOTHING)
    for (const row of rows) {
      if (isSnapshotOrSummaryRow(row)) {
        continue; // snapshot/summary/model_stats 등은 ledger에 추가하지 않고 스킵
      }

      const input = usageInputFromRow(rawApiKey, row, upstreamSource);
      if (input === null) {
        continue;
      }

      try {
        await client.query(`
          INSERT INTO usage_logs (
            fp_full,
            fp16,
            last4,
            request_id,
            model,
            reasoning_effort,
            input_tokens,
            output_tokens,
            cost_usd,
            request_source,
            occurred_at,
            upstream_source,
            raw_payload_hash,
            duration_ms,
            status_code,
            status_reason
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (fp_full, request_id) DO NOTHING
        `, [
          input.fp_full,
          input.fp16,
          input.last4,
          input.requestId,
          input.model,
          input.reasoningEffort,
          input.inputTokens,
          input.outputTokens,
          input.costUsd,
          input.requestSource,
          input.occurredAt,
          input.upstreamSource,
          input.rawPayloadHash,
          input.durationMs ?? 0,
          input.statusCode ?? null,
          input.statusReason ?? null,
        ]);
      } catch (insertError) {
        console.error('[ledger.insert.fail]', JSON.stringify({
          fp16: input.fp16,
          requestId: input.requestId,
          reason: insertError instanceof Error ? insertError.message : 'unknown',
        }));
        throw insertError;
      }
    }
  });
}

/**
 * readLedgerUsageRows
 * 단일 키 격리 조회를 만족하며, request_source = 'user_prompt' 인 rows만 limit 개수만큼 최신순 조회
 */
export async function readLedgerUsageRows(
  fpFull: string, 
  limit = 30, 
  keyIdentifier = ''
): Promise<UsageEventDto[]> {
  if (!hasUsageLedger()) {
    return [];
  }

  return withLedgerClient(async (client) => {
    const result = await client.query<LedgerUsageRow>(
      `
        SELECT fp_full,
               fp16,
               last4,
               request_id,
               model,
               reasoning_effort,
               input_tokens,
               output_tokens,
               cost_usd,
               request_source,
               occurred_at,
               duration_ms,
               status_code,
               status_reason
          FROM usage_logs
         WHERE fp_full = $1
           AND request_source = 'user_prompt'
         ORDER BY occurred_at DESC NULLS LAST, id DESC
         LIMIT $2
      `,
      [fpFull, limit]
    );

    return result.rows.map((row) => rowToUsageEvent(row, keyIdentifier));
  });
}

/**
 * readLedgerUsageRowsInRange
 * Asia/Seoul KST 기준으로 [startIsoUtc, endIsoUtc) 윈도우의 행을 최신순으로 limit 만큼 반환.
 * startIsoUtc / endIsoUtc 가 null이면 해당 방향 조건을 비활성화.
 */
export async function readLedgerUsageRowsInRange(
  fpFull: string,
  startIsoUtc: string | null,
  endIsoUtc: string | null,
  keyIdentifier = '',
  limit = 500
): Promise<UsageEventDto[]> {
  if (!hasUsageLedger()) {
    return [];
  }

  return withLedgerClient(async (client) => {
    const result = await client.query<LedgerUsageRow>(
      `
        SELECT fp_full,
               fp16,
               last4,
               request_id,
               model,
               reasoning_effort,
               input_tokens,
               output_tokens,
               cost_usd,
               request_source,
               occurred_at,
               duration_ms,
               status_code,
               status_reason
          FROM usage_logs
         WHERE fp_full = $1
           AND request_source = 'user_prompt'
           AND ($2::timestamptz IS NULL OR occurred_at >= $2::timestamptz)
           AND ($3::timestamptz IS NULL OR occurred_at <  $3::timestamptz)
         ORDER BY occurred_at DESC NULLS LAST, id DESC
         LIMIT $4
      `,
      [fpFull, startIsoUtc, endIsoUtc, limit]
    );

    return result.rows.map((row) => rowToUsageEvent(row, keyIdentifier));
  });
}

export interface LedgerUsageSummary {
  requests: number;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
}

/**
 * readLedgerUsageSummary
 * range 윈도우 전체에 대한 SUM/COUNT. 표시 limit 와 무관하게 진짜 총계 반환.
 */
export async function readLedgerUsageSummary(
  fpFull: string,
  startIsoUtc: string | null,
  endIsoUtc: string | null
): Promise<LedgerUsageSummary> {
  if (!hasUsageLedger()) {
    return { requests: 0, tokensIn: 0, tokensOut: 0, costUsd: 0 };
  }

  return withLedgerClient(async (client) => {
    const result = await client.query<{
      requests: string | number | null;
      tokens_in: string | number | null;
      tokens_out: string | number | null;
      cost_usd: string | number | null;
    }>(
      `
        SELECT COUNT(*)::int                        AS requests,
               COALESCE(SUM(input_tokens), 0)::int  AS tokens_in,
               COALESCE(SUM(output_tokens), 0)::int AS tokens_out,
               COALESCE(SUM(cost_usd), 0)           AS cost_usd
          FROM usage_logs
         WHERE fp_full = $1
           AND request_source = 'user_prompt'
           AND ($2::timestamptz IS NULL OR occurred_at >= $2::timestamptz)
           AND ($3::timestamptz IS NULL OR occurred_at <  $3::timestamptz)
      `,
      [fpFull, startIsoUtc, endIsoUtc]
    );

    const row = result.rows[0];
    const cost = Number(row?.cost_usd ?? 0);
    return {
      requests: Number(row?.requests ?? 0),
      tokensIn: Number(row?.tokens_in ?? 0),
      tokensOut: Number(row?.tokens_out ?? 0),
      costUsd: Number.isFinite(cost) ? Number(cost.toFixed(6)) : 0,
    };
  });
}

/**
 * readLedgerCredit
 * api_key_balance 테이블로부터 fingerprint에 해당하는 잔액을 격리 조회
 */
export async function readLedgerCredit(fpFull: string): Promise<CreditSummary | null> {
  if (!hasUsageLedger()) {
    return null;
  }

  return withLedgerClient(async (client) => {
    const result = await client.query<LedgerBalanceRow>(
      `
        SELECT initial_balance_usd,
               last_topup_balance_usd,
               current_balance_usd,
               updated_at
          FROM api_key_balance
         WHERE fp_full = $1
         LIMIT 1
      `,
      [fpFull]
    );
    const row = result.rows[0];
    if (row === undefined) {
      return null;
    }

    const remainingUsd = numberFromDb(row.current_balance_usd);
    const initialUsd = numberFromDb(row.initial_balance_usd);
    const baselineUsd = numberFromDb(row.last_topup_balance_usd);
    const usedUsd = baselineUsd !== null && remainingUsd !== null ? Math.max(baselineUsd - remainingUsd, 0) : null;

    return {
      remainingUsd,
      usedUsd: usedUsd !== null ? roundMoney(usedUsd) : null,
      limitUsd: baselineUsd ?? initialUsd,
      initialUsd,
      baselineUsd,
      percentUsed:
        baselineUsd !== null && baselineUsd > 0 && usedUsd !== null
          ? roundMoney((usedUsd / baselineUsd) * 100)
          : null,
      status: 'active',
      source: 'ledger.balance',
      lastUsedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
    };
  });
}

/**
 * ensureBalanceRow
 */
async function ensureBalanceRow(client: PoolClient, fpFull: string, credit: CreditSummary | null): Promise<void> {
  const basis = creditBasis(credit);
  await client.query(
    `
      INSERT INTO api_key_balance (
        fp_full,
        initial_balance_usd,
        last_topup_balance_usd,
        current_balance_usd,
        updated_at
      )
      VALUES ($1, $2, $3, $4, now())
      ON CONFLICT (fp_full) DO NOTHING
    `,
    [
      fpFull,
      basis.initial,
      basis.baseline,
      basis.remaining,
    ]
  );
}

/**
 * upsertBalanceSnapshot
 */
async function upsertBalanceSnapshot(client: PoolClient, fpFull: string, credit: CreditSummary | null): Promise<void> {
  if (credit === null) {
    return;
  }
  const basis = creditBasis(credit);
  await client.query(
    `
      UPDATE api_key_balance
         SET initial_balance_usd = COALESCE(NULLIF(initial_balance_usd, 0), $2::numeric),
             last_topup_balance_usd = GREATEST(last_topup_balance_usd, $3::numeric),
             current_balance_usd = $4::numeric,
             updated_at = now()
       WHERE fp_full = $1
    `,
    [fpFull, basis.initial, basis.baseline, basis.remaining]
  );
}

function creditBasis(credit: CreditSummary | null): { initial: number; baseline: number; remaining: number } {
  const remaining = credit?.remainingUsd ?? 0;
  const used = credit?.usedUsd ?? 0;
  const baseline = credit?.baselineUsd ?? credit?.limitUsd ?? remaining + used;
  const initial = credit?.initialUsd ?? credit?.limitUsd ?? baseline;
  return {
    initial: roundMoney(initial),
    baseline: roundMoney(baseline),
    remaining: roundMoney(remaining),
  };
}

function rowToUsageEvent(row: LedgerUsageRow, keyIdentifier: string): UsageEventDto {
  const occurredAtStr = row.occurred_at instanceof Date
    ? row.occurred_at.toISOString()
    : typeof row.occurred_at === 'string'
      ? row.occurred_at
      : null;

  return UsageEventDtoSchema.parse({
    keyIdentifier,
    request_id: row.request_id,
    model: row.model,
    reasoning_effort: row.reasoning_effort ?? 'default',
    input_tokens: Number(row.input_tokens),
    output_tokens: Number(row.output_tokens),
    total_tokens: Number(row.input_tokens) + Number(row.output_tokens),
    actual_cost: Number(row.cost_usd),
    cost: Number(row.cost_usd),
    created_at: occurredAtStr ?? '',
    request_source: row.request_source,
    duration_ms: row.duration_ms ? Number(row.duration_ms) : 0,
    status_code: row.status_code ?? null,
    status_reason: row.status_reason ?? null,
  });
}

function objectValue(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown): string | null {
  if (typeof value === 'string' && value.trim() !== '') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function numeric(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function positiveInteger(value: unknown): number {
  return Math.max(0, Math.round(numeric(value)));
}

function roundMoney(value: number): number {
  return Number(value.toFixed(6));
}
