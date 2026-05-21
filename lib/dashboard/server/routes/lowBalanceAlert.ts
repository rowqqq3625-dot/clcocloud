import 'server-only';

import type { KeyContext } from '../keys/registry';
import type { CreditSummary } from './types';

const LOW_BALANCE_USD = 1;
const DEDUPE_TTL_MS = 24 * 60 * 60 * 1000;
const PLAN_TOLERANCE = 0.01;
const MAX_LOW_BALANCE_RECORDS = 500;

const alertedFingerprints = new Map<string, number>();
const lowBalanceRecords = new Map<string, LowBalanceRecord>();

export type KeyPlanLabel = '체험키' | '베이직키' | '플러스키' | '프로키' | '기타키';

interface LowBalanceAlertInput {
  credit: CreditSummary;
  ctx: KeyContext;
  occurredAt?: Date;
}

export interface LowBalanceRecord {
  plan: KeyPlanLabel;
  keyLabel: string;
  fp16: string;
  lastFour: string;
  remainingUsd: number | null;
  initialUsd: number | null;
  baselineUsd: number | null;
  usedUsd: number | null;
  lastUsedAt: string | null;
  occurredAt: string;
}

export function classifyKeyPlan(credit: CreditSummary): KeyPlanLabel {
  const basis =
    numeric(credit.initialUsd) ??
    numeric(credit.baselineUsd) ??
    numeric(credit.limitUsd) ??
    computedBasis(credit);

  if (basis === null) {
    return '기타키';
  }
  if (near(basis, 5)) {
    return '체험키';
  }
  if (near(basis, 200)) {
    return '베이직키';
  }
  if (near(basis, 500)) {
    return '플러스키';
  }
  if (near(basis, 1000)) {
    return '프로키';
  }
  return '기타키';
}

export function isLowBalanceCredit(credit: CreditSummary): boolean {
  const remaining = numeric(credit.remainingUsd);
  return remaining !== null && remaining < LOW_BALANCE_USD;
}

export function notifyLowBalanceIfNeeded(input: LowBalanceAlertInput): Promise<void> {
  if (!isLowBalanceCredit(input.credit)) {
    return Promise.resolve();
  }

  pruneDedupe();
  const fingerprint = input.ctx.fingerprint;
  const now = Date.now();
  const previous = alertedFingerprints.get(fingerprint);
  if (previous !== undefined && previous > now) {
    return Promise.resolve();
  }
  alertedFingerprints.set(fingerprint, now + DEDUPE_TTL_MS);

  const occurredAt = input.occurredAt ?? new Date();
  const plan = classifyKeyPlan(input.credit);
  lowBalanceRecords.set(fingerprint, {
    plan,
    keyLabel: keyDisplayName(input.ctx, plan),
    fp16: input.ctx.fingerprint.slice(0, 16),
    lastFour: input.ctx.lastFour,
    remainingUsd: numeric(input.credit.remainingUsd),
    initialUsd: numeric(input.credit.initialUsd),
    baselineUsd: numeric(input.credit.baselineUsd),
    usedUsd: numeric(input.credit.usedUsd),
    lastUsedAt: input.credit.lastUsedAt,
    occurredAt: occurredAt.toISOString(),
  });
  trimRecords();
  return Promise.resolve();
}

export function resetLowBalanceAlertDedupeForTests(): void {
  alertedFingerprints.clear();
  lowBalanceRecords.clear();
}

export function listLowBalanceRecords(): LowBalanceRecord[] {
  return Array.from(lowBalanceRecords.values())
    .sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt));
}

function numeric(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function computedBasis(credit: CreditSummary): number | null {
  const remaining = numeric(credit.remainingUsd);
  const used = numeric(credit.usedUsd);
  return remaining !== null && used !== null ? remaining + used : null;
}

function near(value: number, target: number): boolean {
  return Math.abs(value - target) <= PLAN_TOLERANCE;
}

function pruneDedupe(): void {
  const now = Date.now();
  for (const [fingerprint, expiresAt] of Array.from(alertedFingerprints.entries())) {
    if (expiresAt <= now) {
      alertedFingerprints.delete(fingerprint);
    }
  }
}

function trimRecords(): void {
  const sorted = Array.from(lowBalanceRecords.entries())
    .sort(([, left], [, right]) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt));
  for (const [fingerprint] of sorted.slice(MAX_LOW_BALANCE_RECORDS)) {
    lowBalanceRecords.delete(fingerprint);
  }
}

function keyDisplayName(ctx: KeyContext, plan: KeyPlanLabel): string {
  const name = ctx.accountKeyMeta.name?.trim();
  if (name !== undefined && name !== '') {
    return name;
  }
  if (ctx.accountKeyMeta.id > 0) {
    return `${plan}-${ctx.accountKeyMeta.id}`;
  }
  return `${plan}-****${ctx.lastFour}`;
}
