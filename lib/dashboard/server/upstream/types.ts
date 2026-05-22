import { z } from 'zod';

const upstreamCodeSchema = z.object({
  code: z.number(),
  message: z.string().optional(),
});

const numericLikeSchema = z.union([z.string(), z.number()]).transform((value) => String(value));
const flexibleNumberSchema = z
  .union([z.number(), z.string()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === '') {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  });
const nullableFlexibleNumberSchema = z
  .union([z.number(), z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  });

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nestedRecord(root: Record<string, unknown>, key: string): Record<string, unknown> {
  return isRecord(root[key]) ? root[key] : {};
}

function firstValue(root: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const value = root[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return undefined;
}

function firstNestedValue(root: Record<string, unknown>, keys: string[]): unknown {
  const metadata = nestedRecord(root, 'metadata');
  const request = nestedRecord(root, 'request');
  const message = nestedRecord(root, 'message');
  const usage = nestedRecord(root, 'usage');

  return (
    firstValue(root, keys) ??
    firstValue(metadata, keys) ??
    firstValue(request, keys) ??
    firstValue(message, keys) ??
    firstValue(usage, keys)
  );
}

function optionalNumberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function optionalStringValue(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

function normalizeTimestamp(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const millis = value < 10_000_000_000 ? value * 1000 : value;
    const date = new Date(millis);
    return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const trimmed = value.trim();
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric) && /^\d+(?:\.\d+)?$/.test(trimmed)) {
      return normalizeTimestamp(numeric);
    }
    const parsed = Date.parse(trimmed);
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : trimmed;
  }

  return undefined;
}

export const UsageSummaryDtoSchema = z
  .object({
    total_requests: z.number().default(0),
    total_input_tokens: z.number().default(0),
    total_output_tokens: z.number().default(0),
    total_cache_tokens: z.number().optional(),
    total_tokens: z.number().default(0),
    total_cost: z.number().default(0),
    total_actual_cost: z.number().default(0),
    average_duration_ms: z.number().default(0),
  })
  .passthrough();

function findReasoningEffortDeep(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        const deepResult = findReasoningEffortDeep(parsed);
        if (deepResult !== undefined) return deepResult;
      } catch {
        // ignore
      }
    }
    return undefined;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const result = findReasoningEffortDeep(item);
      if (result !== undefined) return result;
    }
    return undefined;
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const targetKeys = ['reasoning', 'thinking', 'effort', 'difficulty', 'level'];
    for (const k of Object.keys(record)) {
      const lowerKey = k.toLowerCase();
      if (targetKeys.some(target => lowerKey.includes(target))) {
        const val = record[k];
        if (val !== undefined && val !== null && val !== '') {
          if (typeof val === 'object') {
            const deepVal = findReasoningEffortDeep(val);
            if (deepVal !== undefined) return deepVal;
          } else {
            return String(val);
          }
        }
      }
    }

    for (const k of Object.keys(record)) {
      const val = record[k];
      if (typeof val === 'object' || (typeof val === 'string' && (val.trim().startsWith('{') || val.trim().startsWith('[')))) {
        const result = findReasoningEffortDeep(val);
        if (result !== undefined) return result;
      }
    }
  }

  return undefined;
}

// RouteAI usage rows are normalized to keyIdentifier for strict isolation.
// Current discovered mapping: api_key_id is the RouteAI filter/row identifier candidate.
// Historical token_id/key_id are accepted only for one-release compatibility with old fixtures.
export const UsageEventDtoSchema = z
  .object({
    keyIdentifier: numericLikeSchema.optional(),
    api_key_id: numericLikeSchema.optional(),
    token_id: numericLikeSchema.optional(),
    key_id: numericLikeSchema.optional(),
    id: numericLikeSchema.optional(),
    model: z.string().optional(),
    endpoint: z.string().optional(),
    type: z.string().optional(),
    reasoning_effort: z.union([z.string(), z.number()]).optional(),
    reasoning: z.union([z.string(), z.number()]).optional(),
    thinking: z.union([z.string(), z.number()]).optional(),
    difficulty: z.union([z.string(), z.number()]).optional(),
    timestamp: z.union([z.string(), z.number()]).optional(),
    request_time: z.union([z.string(), z.number()]).optional(),
    started_at: z.union([z.string(), z.number()]).optional(),
    completed_at: z.union([z.string(), z.number()]).optional(),
    request: z
      .object({
        reasoning_effort: z.union([z.string(), z.number()]).optional(),
      })
      .passthrough()
      .optional(),
    metadata: z
      .object({
        reasoning_effort: z.union([z.string(), z.number()]).optional(),
      })
      .passthrough()
      .optional(),
    input_tokens: flexibleNumberSchema,
    output_tokens: flexibleNumberSchema,
    total_tokens: flexibleNumberSchema,
    cost: flexibleNumberSchema,
    actual_cost: flexibleNumberSchema,
    duration_ms: flexibleNumberSchema,
    created_at: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough()
  .transform((row, ctx) => {
    let keyIdentifier = row.keyIdentifier ?? row.api_key_id ?? row.key_id ?? row.token_id ?? row.id;

    if (keyIdentifier === undefined || keyIdentifier === '') {
      keyIdentifier = '__direct_key__';
    }

    const reasoningLabel = findReasoningEffortDeep(row) ?? '기본값';
    const record = row as Record<string, unknown>;
    const model = row.model ?? optionalStringValue(firstNestedValue(record, ['modelName', 'model_name', 'model']));
    const inputTokens =
      row.input_tokens ??
      optionalNumberValue(firstNestedValue(record, ['inputTokens', 'input_tokens', 'promptTokens', 'prompt_tokens', 'tokensIn', 'tokens_in', 'input_token_count']));
    const outputTokens =
      row.output_tokens ??
      optionalNumberValue(firstNestedValue(record, ['outputTokens', 'output_tokens', 'completionTokens', 'completion_tokens', 'tokensOut', 'tokens_out', 'output_token_count']));
    const totalTokens =
      row.total_tokens ??
      optionalNumberValue(firstNestedValue(record, ['totalTokens', 'total_tokens', 'tokens', 'tokenCount', 'token_count', 'total_token_count']));
    const cost =
      row.cost ??
      optionalNumberValue(firstNestedValue(record, ['costUsd', 'cost_usd', 'standardCostUsd', 'standard_cost_usd', 'cost']));
    const actualCost =
      row.actual_cost ??
      optionalNumberValue(firstNestedValue(record, ['actualCostUsd', 'actual_cost_usd', 'actualCost', 'actual_cost', 'chargedAmount', 'charged_amount', 'amountUsd', 'amount_usd']));
    const durationMs =
      row.duration_ms ??
      optionalNumberValue(firstNestedValue(record, ['durationMs', 'duration_ms', 'latencyMs', 'latency_ms', 'elapsedMs', 'elapsed_ms']));
    const createdAt = normalizeTimestamp(
      row.created_at ??
      row.timestamp ??
      row.request_time ??
      row.started_at ??
      row.completed_at ??
      firstNestedValue(record, ['createdAt', 'created_at', 'timestamp', 'time', 'date', 'requestTime', 'request_time', 'startedAt', 'started_at', 'completedAt', 'completed_at'])
    );

    return {
      ...row,
      keyIdentifier,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      cost,
      actual_cost: actualCost,
      duration_ms: durationMs,
      created_at: createdAt,
      reasoningLabel: String(reasoningLabel),
    };
  });

export const UsageEventsPageDtoSchema = z
  .object({
    items: z.array(UsageEventDtoSchema),
    total: z.number(),
    page: z.number(),
    page_size: z.number(),
    pages: z.number(),
  })
  .passthrough();

export const AccountKeyDtoSchema = z
  .object({
    id: numericLikeSchema,
    key: z.string().optional(),
    value: z.string().optional(),
    token: z.string().optional(),
    api_key: z.string().optional(),
    name: z.string().nullable().optional(),
    status: z.string(),
    group_id: z.number().nullable().optional(),
    quota: nullableFlexibleNumberSchema,
    quota_used: nullableFlexibleNumberSchema,
    remaining: nullableFlexibleNumberSchema,
    remaining_balance: nullableFlexibleNumberSchema,
    balance: nullableFlexibleNumberSchema,
    used_amount: nullableFlexibleNumberSchema,
    total_amount: nullableFlexibleNumberSchema,
    initial_amount: nullableFlexibleNumberSchema,
    baseline_amount: nullableFlexibleNumberSchema,
    last_used_at: z.string().nullable().optional(),
    expires_at: z.string().nullable().optional(),
    created_at: z.string().optional(),
  })
  .passthrough();

export const UsageSummaryResponseSchema = upstreamCodeSchema
  .extend({
    data: UsageSummaryDtoSchema,
  })
  .passthrough();

export const UsageEventsResponseSchema = upstreamCodeSchema
  .extend({
    data: UsageEventsPageDtoSchema,
  })
  .passthrough();

export const AccountKeysResponseSchema = upstreamCodeSchema
  .extend({
    data: z
      .object({
        items: z.array(AccountKeyDtoSchema),
        total: z.number().optional(),
        page: z.number().optional(),
        page_size: z.number().optional(),
        pages: z.number().optional(),
      })
      .passthrough(),
  })
  .passthrough();

export type UsageSummaryDto = z.output<typeof UsageSummaryDtoSchema>;
export type UsageEventDto = z.output<typeof UsageEventDtoSchema>;
export type UsageEventsPageDto = z.output<typeof UsageEventsPageDtoSchema>;
export type AccountKeyDto = z.output<typeof AccountKeyDtoSchema>;

export interface UsageRange {
  startDate: string;
  endDate: string;
  timezone?: string;
}

export interface UsageEventsPageRequest {
  page: number;
  pageSize: number;
}
