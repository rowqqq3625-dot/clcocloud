import 'server-only';

import { Pool, type PoolClient, type QueryResultRow } from 'pg';

let pool: Pool | null = null;

export function isLedgerEnabled(): boolean {
  return (process.env.DATABASE_URL ?? '') !== '';
}

let tablesInitialized = false;

async function initializeTables(client: PoolClient) {
  if (tablesInitialized) return;

  // Drop old tables to migrate to the new isolation schemas perfectly
  await client.query(`
    DROP TABLE IF EXISTS public.usage_logs CASCADE;
    DROP TABLE IF EXISTS public.api_key_balance CASCADE;
  `);

  await client.query(`
    CREATE TABLE public.api_key_balance (
      fp_full                 char(64) PRIMARY KEY,
      initial_balance_usd     numeric(12,6) NOT NULL,
      last_topup_balance_usd  numeric(12,6) NOT NULL,
      current_balance_usd     numeric(12,6) NOT NULL,
      updated_at              timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE public.usage_logs (
      id                  bigserial PRIMARY KEY,
      fp_full             char(64)        NOT NULL,
      fp16                char(16)        NOT NULL,
      last4               char(4)         NOT NULL,
      request_id          text            NOT NULL,
      model               text            NOT NULL,
      reasoning_effort    text            NULL,
      input_tokens        integer         NOT NULL DEFAULT 0,
      output_tokens       integer         NOT NULL DEFAULT 0,
      total_tokens        integer         GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
      cost_usd            numeric(12,6)   NOT NULL DEFAULT 0,
      request_source      text            NOT NULL,
      occurred_at         timestamptz     NULL,
      ingested_at         timestamptz     NOT NULL DEFAULT now(),
      upstream_source     text            NOT NULL,
      raw_payload_hash    char(64)        NOT NULL,
      CONSTRAINT unique_fp_request UNIQUE (fp_full, request_id)
    );

    CREATE INDEX IF NOT EXISTS idx_usage_logs_fp_occurred ON public.usage_logs (fp_full, occurred_at DESC NULLS LAST);
    CREATE INDEX IF NOT EXISTS idx_usage_logs_fp_source_occurred ON public.usage_logs (fp_full, request_source, occurred_at DESC NULLS LAST);
  `);
  tablesInitialized = true;
}

export function getLedgerPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString === undefined || connectionString === '') {
    throw new Error('DATABASE_URL is required for the usage ledger');
  }

  if (pool === null) {
    pool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
    });
  }

  return pool;
}

export async function withLedgerClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getLedgerPool().connect();
  try {
    if (!tablesInitialized) {
      await initializeTables(client).catch((err) => {
        console.error('Failed to initialize database tables:', err);
      });
    }
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function withLedgerTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  return withLedgerClient(async (client) => {
    await client.query('BEGIN');
    try {
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
}

export function numberFromDb(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function stringFromDb<Row extends QueryResultRow>(row: Row, key: keyof Row): string | null {
  const value = row[key];
  if (typeof value === 'string' && value !== '') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

export function resetLedgerPoolForTests(): void {
  void pool?.end();
  pool = null;
}
