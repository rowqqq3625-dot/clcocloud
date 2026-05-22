import type { SummaryResponseBody } from './types';
import type { KeyContext } from '../keys/registry';
import type { UsageEventDto } from '../upstream/types';

export function aggregateUsage(rows: UsageEventDto[], ctx?: KeyContext): SummaryResponseBody {
  let tokensIn = 0;
  let tokensOut = 0;
  let costUsd = 0;
  let actualCostUsd = 0;
  let latencyTotal = 0;
  let latencyCount = 0;
  let requestCount = 0;

  for (const row of rows) {
    if (isDirectMetaOnly(row) || !hasValidCreatedAt(row)) {
      continue;
    }
    requestCount += 1;
    tokensIn += row.input_tokens ?? 0;
    tokensOut += row.output_tokens ?? 0;
    costUsd += row.cost ?? 0;
    actualCostUsd += row.actual_cost ?? row.cost ?? 0;

    if (row.duration_ms !== undefined) {
      latencyTotal += row.duration_ms;
      latencyCount += 1;
    }
  }

  const directRow = rows.find(
    (row) => (row as any).direct_summary_requests !== undefined || isDirectMetaOnly(row)
  ) as any;
  if (directRow) {
    const directRequests = directRow.direct_summary_requests ?? 0;
    const directUsedAmount = directRow.direct_used_amount ?? 0;
    if (directRequests > 0) {
      requestCount = directRequests;
      tokensIn = directRow.direct_summary_input_tokens ?? 0;
      tokensOut = directRow.direct_summary_output_tokens ?? directRow.direct_summary_total_tokens ?? 0;
      costUsd = directRow.direct_summary_cost ?? 0;
      actualCostUsd = directRow.direct_summary_actual_cost ?? directRow.direct_summary_cost ?? 0;
      latencyTotal = directRow.direct_summary_duration_ms ?? 0;
      latencyCount = latencyTotal > 0 ? 1 : 0;
    } else if (directUsedAmount > 0) {
      costUsd = directUsedAmount;
      actualCostUsd = directUsedAmount;
      requestCount = Math.max(1, Math.round(directUsedAmount / 0.015));
      tokensIn = Math.round(directUsedAmount * 60000);
      tokensOut = Math.round(directUsedAmount * 40000);
      latencyTotal = requestCount * 1200;
      latencyCount = requestCount;
    }
  }

  return {
    requests: requestCount,
    tokensIn,
    tokensOut,
    costUsd,
    actualCostUsd,
    avgLatencyMs: latencyCount > 0 ? latencyTotal / latencyCount : 0,
    credit: creditFromKeyContext(ctx),
  };
}

function isDirectMetaOnly(row: UsageEventDto): boolean {
  return (row as UsageEventDto & Record<string, unknown>)._directMetaOnly === true;
}

function hasValidCreatedAt(row: UsageEventDto): boolean {
  if (row.created_at === undefined || row.created_at === '') {
    return false;
  }
  return Number.isFinite(Date.parse(row.created_at));
}

function roundedMoney(value: number) {
  return Number(value.toFixed(4));
}

function numeric(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function creditFromKeyContext(ctx?: KeyContext): SummaryResponseBody['credit'] {
  const meta = ctx?.accountKeyMeta;
  const quota = numeric(meta?.quota);
  const quotaUsed = numeric(meta?.quota_used);
  const totalAmount = numeric(meta?.total_amount);
  const usedAmount = numeric(meta?.used_amount);
  const initialAmount = numeric(meta?.initial_amount);
  const baselineAmount = numeric(meta?.baseline_amount);
  const remaining = numeric(meta?.remaining);
  const remainingBalance = numeric(meta?.remaining_balance);
  const balance = numeric(meta?.balance);

  const limitUsd = totalAmount ?? quota;
  const usedUsd = usedAmount ?? quotaUsed;
  const remainingUsd =
    remainingBalance ??
    remaining ??
    balance ??
    (limitUsd !== null && usedUsd !== null && limitUsd > 0 ? Math.max(limitUsd - usedUsd, 0) : null);
  const computedBaseline =
    remainingUsd !== null && usedUsd !== null ? roundedMoney(remainingUsd + usedUsd) : null;
  const initialUsd = initialAmount ?? limitUsd ?? computedBaseline;
  const baselineUsd =
    baselineAmount ??
    balance ??
    remainingBalance ??
    quota ??
    computedBaseline ??
    remaining;
  const percentUsed =
    limitUsd !== null && limitUsd > 0 && usedUsd !== null ? (usedUsd / limitUsd) * 100 : null;

  let source = 'keys.unavailable';
  if (remainingBalance !== null || remaining !== null || balance !== null) {
    source = 'keys.balance';
  } else if (totalAmount !== null || usedAmount !== null) {
    source = 'keys.amount';
  } else if (quota !== null || quotaUsed !== null) {
    source = 'keys.quota';
  }

  return {
    remainingUsd,
    usedUsd,
    limitUsd,
    initialUsd,
    baselineUsd,
    percentUsed,
    status: meta?.status ?? null,
    source,
    lastUsedAt: meta?.last_used_at ?? null,
  };
}
