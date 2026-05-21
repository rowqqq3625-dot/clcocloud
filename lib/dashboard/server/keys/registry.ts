import 'server-only';

import {
  getRouteAiProxyMode,
  listAccountKeys,
} from '../upstream/client';
import type { AccountKeyDto } from '../upstream/types';
import type { OperatorSession } from '../../types/session';
import { fingerprint, safeEq } from './fingerprint';

const API_KEY_PATTERN = /^sk-(?:ant-api\d{2}-)?[A-Za-z0-9._-]{8,512}$/;
const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 1_000;

export interface KeyContext {
  fingerprint: string;
  identifierForRows: string;
  lastFour: string;
  accountKeyMeta: {
    id: number;
    name?: string | null;
    status: string;
    group_id?: number | null;
    quota?: number | null;
    quota_used?: number | null;
    remaining?: number | null;
    remaining_balance?: number | null;
    balance?: number | null;
    used_amount?: number | null;
    total_amount?: number | null;
    initial_amount?: number | null;
    baseline_amount?: number | null;
    last_used_at?: string | null;
    expires_at?: string | null;
  };
}

interface CacheEntry {
  expiresAt: number;
  value: KeyContext;
}

const keyContextCache = new Map<string, CacheEntry>();

export class AipInvalidKeyFormatError extends Error {
  constructor() {
    super('INVALID_FORMAT');
    this.name = 'AipInvalidKeyFormatError';
  }
}

export class AipForeignKeyError extends Error {
  constructor() {
    super('FOREIGN_KEY');
    this.name = 'AipForeignKeyError';
  }
}

export function isValidUserKeyFormat(plaintextKey: string): boolean {
  return API_KEY_PATTERN.test(plaintextKey);
}

function pruneCache(now: number): void {
  for (const [key, entry] of Array.from(keyContextCache.entries())) {
    if (entry.expiresAt <= now) {
      keyContextCache.delete(key);
    }
  }

  while (keyContextCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = keyContextCache.keys().next().value as string | undefined;
    if (oldestKey === undefined) {
      break;
    }
    keyContextCache.delete(oldestKey);
  }
}

function buildKeyContext(plaintextKey: string, fp: string, accountKey: AccountKeyDto): KeyContext {
  const id = String(accountKey.id);
  return {
    fingerprint: fp,
    identifierForRows: id,
    lastFour: plaintextKey.slice(-4),
    accountKeyMeta: {
      id: Number.isFinite(Number(id)) ? Number(id) : 0,
      name: accountKey.name,
      status: accountKey.status,
      group_id: accountKey.group_id,
      quota: accountKey.quota,
      quota_used: accountKey.quota_used,
      remaining: accountKey.remaining,
      remaining_balance: accountKey.remaining_balance,
      balance: accountKey.balance,
      used_amount: accountKey.used_amount,
      total_amount: accountKey.total_amount,
      initial_amount: accountKey.total_amount ?? accountKey.quota,
      baseline_amount: accountKey.balance ?? accountKey.remaining_balance ?? accountKey.remaining ?? accountKey.quota,
      last_used_at: accountKey.last_used_at,
      expires_at: accountKey.expires_at,
    },
  };
}

function accountKeyPlaintext(candidate: AccountKeyDto): string | undefined {
  return candidate.key ?? candidate.value ?? candidate.token ?? candidate.api_key;
}

function buildDirectKeyContext(plaintextKey: string, fp: string): KeyContext {
  return {
    fingerprint: fp,
    identifierForRows: '__direct_key__',
    lastFour: plaintextKey.slice(-4),
    accountKeyMeta: {
      id: 0,
      status: 'direct',
    },
  };
}

export async function resolveUserKey(
  plaintextKey: string,
  session?: OperatorSession
): Promise<KeyContext> {
  if (!isValidUserKeyFormat(plaintextKey)) {
    throw new AipInvalidKeyFormatError();
  }

  const fp = fingerprint(plaintextKey);
  const now = Date.now();
  pruneCache(now);

  const cacheKey = session === undefined ? `direct:${fp}` : `operator:${fp}`;
  const cached = keyContextCache.get(cacheKey);
  if (cached !== undefined && cached.expiresAt > now) {
    keyContextCache.delete(cacheKey);
    keyContextCache.set(cacheKey, cached);
    return cached.value;
  }

  if (getRouteAiProxyMode() === 'direct' && session === undefined) {
    const ctx = buildDirectKeyContext(plaintextKey, fp);
    keyContextCache.set(cacheKey, {
      expiresAt: now + CACHE_TTL_MS,
      value: ctx,
    });
    pruneCache(now);
    return ctx;
  }

  if (session === undefined) {
    throw new Error('Operator session is required for RouteAI operator proxy mode');
  }

  const accountKeys = await listAccountKeys(session);
  const accountKey = accountKeys.find((candidate) => {
    const candidateKey = accountKeyPlaintext(candidate);
    return candidateKey !== undefined && safeEq(candidateKey, plaintextKey);
  });

  if (accountKey === undefined) {
    throw new AipForeignKeyError();
  }

  const ctx = buildKeyContext(plaintextKey, fp, accountKey);
  keyContextCache.set(cacheKey, {
    expiresAt: now + CACHE_TTL_MS,
    value: ctx,
  });
  pruneCache(now);

  return ctx;
}

export function resetKeyRegistryCacheForTests(): void {
  keyContextCache.clear();
}
