import 'server-only';

import { createHash, randomUUID } from 'crypto';
import type { PoolClient, QueryResultRow } from 'pg';
import type { UsageEventDto } from '../upstream/types';
import { UsageEventDtoSchema } from '../upstream/types';
import type { CreditSummary } from '../routes/types';
import { isLedgerEnabled, numberFromDb, withLedgerClient, withLedgerTransaction } from './db';

export interface LedgerUsageInput {
  apiKeyId: string;
  requestId: string;
  model: string;
  reasoningEffort?: string | null;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  requestSource: 'user_prompt' | 'slash_command' | 'system';
  occurredAt: string;
}

interface LedgerUsageRow extends QueryResultRow {
  api_key_id: string;
  request_id: string;
  model: string;
  reasoning_effort: string | null;
  input_tokens: string | number;
  output_tokens: string | number;
  cost_usd: string | number;
  request_source: string;
  occurred_at: string | Date;
}

interface LedgerBalanceRow extends QueryResultRow {
  initial_balance_usd: string | number | null;
  last_topup_balance_usd: string | number | null;
  current_balance_usd: string | number | null;
  updated_at: string | Date | null;
}

export function hasUsageLedger(): boolean {
  return isLedgerEnabled();
}

export async function recordUsageTransaction(input: LedgerUsageInput): Promise<boolean> {
  return withLedgerTransaction(async (client) => {
    await ensureBalanceRow(client, input.apiKeyId, null);
    const inserted = await client.query<{ request_id: string }>(
      `
        INSERT INTO usage_logs (
          api_key_id,
          request_id,
          model,
          reasoning_effort,
          input_tokens,
          output_tokens,
          cost_usd,
          request_source,
          occurred_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (request_id) DO NOTHING
        RETURNING request_id
      `,
      [
        input.apiKeyId,
        input.requestId,
        input.model,
        input.reasoningEffort ?? 'default',
        input.inputTokens,
        input.outputTokens,
        input.costUsd,
        input.requestSource,
        input.occurredAt,
      ]
    );

    if (inserted.rowCount === 0) {
      return false;
    }

    await client.query(
      `
        UPDATE api_key_balance
           SET current_balance_usd = GREATEST(current_balance_usd - $2::numeric, 0),
               updated_at = now()
         WHERE api_key_id = $1
      `,
      [input.apiKeyId, input.costUsd]
    );

    return true;
  });
}

export async function syncUsageLedgerFromRows(apiKeyId: string, rows: UsageEventDto[], credit?: CreditSummary): Promise<void> {
  if (!hasUsageLedger()) {
    return;
  }

  await withLedgerTransaction(async (client) => {
    await ensureBalanceRow(client, apiKeyId, credit ?? null);
    await upsertBalanceSnapshot(client, apiKeyId, credit ?? null);

    for (const row of rows) {
      if (isMetaOnly(row)) {
        continue;
      }
      const input = usageInputFromRow(apiKeyId, row);
      if (input === null) {
        continue;
      }
      await client.query(
        `
          INSERT INTO usage_logs (
            api_key_id,
            request_id,
            model,
            reasoning_effort,
            input_tokens,
            output_tokens,
            cost_usd,
            request_source,
            occurred_at
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
          ON CONFLICT (request_id) DO UPDATE
             SET model = EXCLUDED.model,
                 reasoning_effort = EXCLUDED.reasoning_effort,
                 input_tokens = EXCLUDED.input_tokens,
                 output_tokens = EXCLUDED.output_tokens,
                 cost_usd = EXCLUDED.cost_usd,
                 request_source = EXCLUDED.request_source,
                 occurred_at = EXCLUDED.occurred_at
        `,
        [
          input.apiKeyId,
          input.requestId,
          input.model,
          input.reasoningEffort ?? 'default',
          input.inputTokens,
          input.outputTokens,
          input.costUsd,
          input.requestSource,
          input.occurredAt,
        ]
      );
    }
  });
}

export async function readLedgerUsageRows(apiKeyId: string, limit = 30, keyIdentifier = apiKeyId): Promise<UsageEventDto[]> {
  if (!hasUsageLedger()) {
    return [];
  }

  return withLedgerClient(async (client) => {
    const result = await client.query<LedgerUsageRow>(
      `
        SELECT api_key_id,
               request_id,
               model,
               reasoning_effort,
               input_tokens,
               output_tokens,
               cost_usd,
               request_source,
               occurred_at
          FROM usage_logs
         WHERE api_key_id = $1
         ORDER BY occurred_at DESC
         LIMIT $2
      `,
      [apiKeyId, limit]
    );

    return result.rows.map((row) => rowToUsageEvent(row, keyIdentifier));
  });
}

export async function readLedgerCredit(apiKeyId: string): Promise<CreditSummary | null> {
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
         WHERE api_key_id = $1
         LIMIT 1
      `,
      [apiKeyId]
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
      usedUsd,
      limitUsd: baselineUsd ?? initialUsd,
      initialUsd,
      baselineUsd,
      percentUsed:
        baselineUsd !== null && baselineUsd > 0 && usedUsd !== null
          ? (usedUsd / baselineUsd) * 100
          : null,
      status: 'active',
      source: 'ledger.balance',
      lastUsedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
    };
  });
}

async function ensureBalanceRow(client: PoolClient, apiKeyId: string, credit: CreditSummary | null): Promise<void> {
  const basis = creditBasis(credit);
  await client.query(
    `
      INSERT INTO api_key_balance (
        api_key_id,
        initial_balance_usd,
        last_topup_balance_usd,
        current_balance_usd
      )
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (api_key_id) DO NOTHING
    `,
    [
      apiKeyId,
      basis.initial,
      basis.baseline,
      basis.remaining,
    ]
  );
}

async function upsertBalanceSnapshot(client: PoolClient, apiKeyId: string, credit: CreditSummary | null): Promise<void> {
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
       WHERE api_key_id = $1
    `,
    [apiKeyId, basis.initial, basis.baseline, basis.remaining]
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

function usageInputFromRow(apiKeyId: string, row: UsageEventDto): LedgerUsageInput | null {
  const occurredAt = row.created_at;
  if (occurredAt === undefined || occurredAt === '') {
    return null;
  }
  const inputTokens = positiveInteger(row.input_tokens);
  const outputTokens = positiveInteger(row.output_tokens);
  const totalTokens = positiveInteger(row.total_tokens);
  const inferredOutput = outputTokens > 0 ? outputTokens : Math.max(totalTokens - inputTokens, 0);
  const costUsd = numeric(row.actual_cost ?? row.cost);

  return {
    apiKeyId,
    requestId: requestIdForRow(apiKeyId, row),
    model: row.model ?? 'unknown',
    reasoningEffort: typeof row.reasoningLabel === 'string' ? row.reasoningLabel : 'default',
    inputTokens,
    outputTokens: inferredOutput,
    costUsd,
    requestSource: isSlashCommand(row) ? 'slash_command' : 'user_prompt',
    occurredAt,
  };
}

function rowToUsageEvent(row: LedgerUsageRow, keyIdentifier: string): UsageEventDto {
  const parsed = UsageEventDtoSchema.parse({
    keyIdentifier,
    request_id: row.request_id,
    model: row.model,
    reasoning_effort: row.reasoning_effort ?? 'default',
    input_tokens: Number(row.input_tokens),
    output_tokens: Number(row.output_tokens),
    total_tokens: Number(row.input_tokens) + Number(row.output_tokens),
    actual_cost: Number(row.cost_usd),
    cost: Number(row.cost_usd),
    created_at: row.occurred_at instanceof Date ? row.occurred_at.toISOString() : row.occurred_at,
    request_source: row.request_source,
  });
  return parsed;
}

function requestIdForRow(apiKeyId: string, row: UsageEventDto): string {
  const record = row as UsageEventDto & Record<string, unknown>;
  const explicit =
    stringValue(record.request_id) ??
    stringValue(record.requestId) ??
    stringValue(record.id) ??
    stringValue(record.message_id) ??
    stringValue(record.messageId);
  if (explicit !== null) {
    return explicit;
  }

  return createHash('sha256')
    .update(JSON.stringify({
      apiKeyId,
      model: row.model ?? '',
      createdAt: row.created_at ?? '',
      inputTokens: row.input_tokens ?? 0,
      outputTokens: row.output_tokens ?? 0,
      totalTokens: row.total_tokens ?? 0,
      cost: row.actual_cost ?? row.cost ?? 0,
      nonce: row.created_at === undefined ? randomUUID() : undefined,
    }))
    .digest('hex');
}

function isMetaOnly(row: UsageEventDto): boolean {
  return (row as UsageEventDto & Record<string, unknown>)._directMetaOnly === true;
}

function isSlashCommand(row: UsageEventDto): boolean {
  return false;
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
  return Number(value.toFixed(4));
}
