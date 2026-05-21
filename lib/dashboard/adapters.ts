import type { EventsBody, SummaryBody } from './client/context/types';
import type { ApiKeyStatus, ApiKeyRecentRequest, ApiKeyStats } from '../keys/types';

export function adaptRecentRequests(rows: Record<string, string | number | null>[]): ApiKeyRecentRequest[] {
  return rows.map((row, index) => {
    const model = String(row['모델명'] ?? 'unknown');
    const totalTokens = Number(row['토큰'] ?? 0);
    const costUsd = Number(row['비용'] ?? 0);
    const createdAt = String(row['시간'] ?? new Date().toISOString());
    const reasoningEffort = row['추론난이도'] !== undefined && row['추론난이도'] !== null ? String(row['추론난이도']) : '기본값';
    const processing = row['처리'] !== undefined && row['처리'] !== null ? String(row['처리']) : '성공';

    // Generate a deterministic and unique requestId for React list rendering and animation keys
    const requestId = `${createdAt}-${model}-${totalTokens}-${costUsd}-${index}`;

    return {
      requestId,
      requestedModel: model,
      totalTokens,
      costUsd,
      latencyMs: 0,
      statusCode: 200,
      createdAt,
      reasoningEffort,
      processing,
    };
  });
}

export function adaptStats(
  events: EventsBody | null,
  summary: SummaryBody | null,
  apiKey: string
): ApiKeyStatus {
  const credit = events?.credit ?? summary?.credit;
  const eventsSummary = events?.summary ?? summary;

  const valid = !!credit;
  const balanceUsd = credit?.remainingUsd ?? 0;
  
  // Spend cap is mapped to the monthly limit (baselineUsd or limitUsd)
  const monthlySpendCapUsd = credit?.baselineUsd ?? credit?.limitUsd ?? null;

  // Prefix extraction
  const prefix = apiKey.substring(0, 10);

  // Status mapping
  const status = (credit?.status ?? 'active').toUpperCase();

  // Allowed models: extract unique models from event rows, or fallback to sensible Claude defaults
  let allowedModels = ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-haiku'];
  if (events && events.rows && events.rows.length > 0) {
    const uniqueModels = Array.from(new Set(events.rows.map((row) => String(row['모델명'] ?? ''))))
      .filter((model) => model !== '');
    if (uniqueModels.length > 0) {
      allowedModels = uniqueModels;
    }
  }

  // Summary statistics mapping
  const totalCostUsd = eventsSummary?.costUsd ?? eventsSummary?.actualCostUsd ?? 0;
  const totalRequests = eventsSummary?.requests ?? events?.total ?? 0;
  const totalTokens = (eventsSummary?.tokensIn ?? 0) + (eventsSummary?.tokensOut ?? 0);

  const stats: ApiKeyStats = {
    totalCostUsd,
    totalRequests,
    totalTokens,
    last7dCostUsd: totalCostUsd,
    last7dRequests: totalRequests,
    last7dTokens: totalTokens,
  };

  const recentRequests = events ? adaptRecentRequests(events.rows) : [];

  return {
    valid,
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
    createdAt: credit?.lastUsedAt ?? new Date().toISOString(),
    lastUsedAt: credit?.lastUsedAt ?? new Date().toISOString(),
  };
}
