import type { EventsBody, SummaryBody } from './client/context/types';
import type { ApiKeyStatus, ApiKeyRecentRequest, ApiKeyStats } from '../keys/types';

function stringValue(value: unknown, fallback = ''): string {
  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
}

function numberValue(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function validDateString(value: unknown): string | null {
  const text = stringValue(value);
  if (text === '') {
    return null;
  }
  return Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : null;
}

export function adaptRecentRequests(rows: Record<string, string | number | null>[]): ApiKeyRecentRequest[] {
  return rows.flatMap((row, index) => {
    const createdAt =
      validDateString(row.createdAt) ??
      validDateString(row['created_at']) ??
      validDateString(row['시간']);
    if (createdAt === null) {
      return [];
    }

    const requestedModel = stringValue(row.model ?? row['model_name'] ?? row['모델명'], 'unknown');
    const inputTokens = numberValue(row.inputTokens ?? row['input_tokens']);
    const outputTokens = numberValue(row.outputTokens ?? row['output_tokens']);
    const totalTokens = numberValue(row.totalTokens ?? row['total_tokens'] ?? row['토큰'], inputTokens + outputTokens);
    const costUsd = numberValue(row.costUsd ?? row['actual_cost'] ?? row['cost'] ?? row['비용']);
    const requestId = stringValue(
      row.requestId ?? row['request_id'] ?? row['message_id'],
      `${createdAt}-${requestedModel}-${totalTokens}-${costUsd}-${index}`
    );

    return [{
      requestId,
      requestedModel,
      inputTokens,
      outputTokens,
      totalTokens,
      costUsd,
      latencyMs: numberValue(row.latencyMs ?? row['duration_ms']),
      statusCode: numberValue(row.statusCode ?? row['status_code'], 200),
      createdAt,
      reasoningEffort: (() => {
        const raw = row.reasoningEffort ?? row.reasoning_effort ?? row['reasoning_effort'] ?? row.reasoningLabel ?? row.reasoning_label ?? row.reasoning ?? row.thinking ?? row.effort ?? row.difficulty ?? row.level ?? row['추론난이도'] ?? row['추론'];
        if (raw === undefined || raw === null || raw === '') return 'default';
        const lower = String(raw).toLowerCase();
        if (lower.includes('xhigh')) return 'xhigh';
        if (lower.includes('max')) return 'max';
        if (lower.includes('high')) return 'high';
        if (lower.includes('medium')) return 'medium';
        if (lower.includes('low')) return 'low';
        if (lower.includes('none')) return 'none';
        return String(raw);
      })(),
      processing: stringValue(row.processing ?? row.status ?? row['처리'], 'success'),
    }];
  });
}

export function adaptStats(
  events: EventsBody | null,
  summary: SummaryBody | null,
  apiKey: string
): ApiKeyStatus {
  const credit = events?.credit ?? summary?.credit;
  const eventsSummary = events?.summary ?? summary;

  const balanceUsd = credit?.remainingUsd ?? 0;
  const monthlySpendCapUsd = credit?.baselineUsd ?? credit?.limitUsd ?? null;
  const prefix = apiKey.substring(0, 10);
  const status = (credit?.status ?? 'active').toUpperCase();

  const recentRequests = events ? adaptRecentRequests(events.rows) : [];
  const allowedModels = recentRequests.length > 0
    ? Array.from(new Set(recentRequests.map((request) => request.requestedModel)))
    : [];

  const totalCostUsd = eventsSummary?.costUsd ?? eventsSummary?.actualCostUsd ?? 0;
  const totalRequests = eventsSummary?.requests ?? 0;
  const totalTokens = (eventsSummary?.tokensIn ?? 0) + (eventsSummary?.tokensOut ?? 0);

  const stats: ApiKeyStats = {
    totalCostUsd,
    totalRequests,
    totalTokens,
    last7dCostUsd: totalCostUsd,
    last7dRequests: totalRequests,
    last7dTokens: totalTokens,
  };

  return {
    valid: !!credit,
    prefix,
    status,
    rateLimitRpm: 1000,
    monthlySpendCapUsd,
    allowedModels,
    balanceUsd,
    initialUsd: credit?.initialUsd ?? null,
    baselineUsd: credit?.baselineUsd ?? null,
    usedUsd: credit?.usedUsd ?? null,
    stats,
    recentRequests,
    createdAt: credit?.lastUsedAt ?? null,
    lastUsedAt: credit?.lastUsedAt ?? null,
  };
}
