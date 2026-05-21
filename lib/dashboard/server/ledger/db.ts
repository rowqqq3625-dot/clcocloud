import 'server-only';

import { Pool, type PoolClient, type QueryResultRow } from 'pg';

let pool: Pool | null = null;

export function isLedgerEnabled(): boolean {
  return (process.env.DATABASE_URL ?? '') !== '';
}

let tablesInitialized = false;

async function initializeTables(client: PoolClient) {
  if (tablesInitialized) return;
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.api_key_balance (
      api_key_id text PRIMARY KEY,
      initial_balance_usd numeric(12, 4) NOT NULL DEFAULT 0,
      last_topup_balance_usd numeric(12, 4) NOT NULL DEFAULT 0,
      current_balance_usd numeric(12, 4) NOT NULL DEFAULT 0,
      updated_at timestamptz DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.usage_logs (
      request_id text PRIMARY KEY,
      api_key_id text NOT NULL,
      model text NOT NULL,
      reasoning_effort text DEFAULT 'default',
      input_tokens integer NOT NULL DEFAULT 0,
      output_tokens integer NOT NULL DEFAULT 0,
      cost_usd numeric(12, 6) NOT NULL DEFAULT 0,
      request_source text NOT NULL DEFAULT 'user_prompt',
      occurred_at timestamptz NOT NULL,
      created_at timestamptz DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_usage_logs_api_key_id ON public.usage_logs (api_key_id);
    CREATE INDEX IF NOT EXISTS idx_usage_logs_occurred_at ON public.usage_logs (occurred_at DESC);
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
