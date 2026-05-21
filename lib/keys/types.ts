import { z } from "zod";

export const ApiKeyRecentRequestSchema = z.object({
  requestId: z.string(),
  requestedModel: z.string(),
  totalTokens: z.number(),
  costUsd: z.number(),
  latencyMs: z.number(),
  statusCode: z.number(),
  createdAt: z.string(), // ISO String
  reasoningEffort: z.string().optional(),
  processing: z.string().optional(),
}).passthrough(); // Preserve any unknown fields

export const ApiKeyStatsSchema = z.object({
  totalCostUsd: z.number(),
  totalRequests: z.number(),
  totalTokens: z.number(),
  last7dCostUsd: z.number(),
  last7dRequests: z.number(),
  last7dTokens: z.number(),
}).passthrough();

export const ApiKeyStatusSchema = z.object({
  valid: z.boolean(),
  accountKind: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  prefix: z.string(),
  status: z.string(),
  rateLimitRpm: z.number(),
  monthlySpendCapUsd: z.number().nullable(),
  allowedModels: z.array(z.string()),
  createdAt: z.string().nullable().optional(),
  lastUsedAt: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  balanceUsd: z.number(),
  initialUsd: z.number().nullable().optional(),
  baselineUsd: z.number().nullable().optional(),
  usedUsd: z.number().nullable().optional(),
  lifetimeConsumedUsd: z.number().nullable().optional(),
  stats: ApiKeyStatsSchema.optional(),
  recentRequests: z.array(ApiKeyRecentRequestSchema).optional(),
}).passthrough();

export type ApiKeyRecentRequest = z.infer<typeof ApiKeyRecentRequestSchema>;
export type ApiKeyStats = z.infer<typeof ApiKeyStatsSchema>;
export type ApiKeyStatus = z.infer<typeof ApiKeyStatusSchema>;
