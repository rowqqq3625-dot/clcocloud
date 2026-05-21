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
  const directSummary = directSummaryFromRows(rows);

  for (const row of rows) {
    if (isDirectMetaOnly(row)) {
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

  return {
    requests: requestCount > 0 ? requestCount : directSummary.requests ?? 0,
    tokensIn: requestCount > 0 ? tokensIn : directSummary.tokensIn ?? 0,
    tokensOut: requestCount > 0 ? tokensOut : directSummary.tokensOut ?? 0,
    costUsd: requestCount > 0 ? costUsd : directSummary.costUsd ?? 0,
    actualCostUsd: requestCount > 0 ? actualCostUsd : directSummary.actualCostUsd ?? directSummary.costUsd ?? 0,
    avgLatencyMs: requestCount > 0
      ? latencyCount > 0 ? latencyTotal / latencyCount : 0
      : directSummary.avgLatencyMs ?? 0,
    credit: creditFromKeyContext(ctx),
  };
}

function isDirectMetaOnly(row: UsageEventDto): boolean {
  return (row as UsageEventDto & Record<string, unknown>)._directMetaOnly === true;
}

function numericFromRow(row: UsageEventDto, key: string): number | null {
  const value = (row as UsageEventDto & Record<string, unknown>)[key];
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function roundedMoney(value: number): number {
  return Number(value.toFixed(4));
}

function directSummaryFromRows(rows: UsageEventDto[]): Partial<SummaryResponseBody> {
  const carrier = rows.find(isDirectMetaOnly);
  if (carrier === undefined) {
    return {};
  }

  const totalTokens = numericFromRow(carrier, 'direct_summary_total_tokens');
  const inputTokens = numericFromRow(carrier, 'direct_summary_input_tokens') ?? 0;
  const outputTokens = numericFromRow(carrier, 'direct_summary_output_tokens') ?? Math.max((totalTokens ?? 0) - inputTokens, 0);

  return {
    requests: numericFromRow(carrier, 'direct_summary_requests') ?? undefined,
    tokensIn: inputTokens,
    tokensOut: outputTokens,
    costUsd: numericFromRow(carrier, 'direct_summary_cost') ?? undefined,
    actualCostUsd: numericFromRow(carrier, 'direct_summary_actual_cost') ?? undefined,
    avgLatencyMs: numericFromRow(carrier, 'direct_summary_duration_ms') ?? undefined,
  };
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
