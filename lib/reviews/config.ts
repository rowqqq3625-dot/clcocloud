import "server-only";

/**
 * Centralized reader for REVIEW_* env vars. Importing this module from
 * both API routes and lib helpers guarantees the same defaults
 * everywhere — useful when ops changes the reward amount and we want
 * a single touch-point.
 *
 * Defaults match .env.example and supabase/migrations/20260528_review_system.sql.
 */

function readPositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function readPositiveNumber(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function getReviewConfig() {
  return {
    eligibilityAfterDays: readPositiveInt(process.env.REVIEW_ELIGIBILITY_AFTER_DAYS, 3),
    rewardUsd: readPositiveNumber(process.env.REVIEW_REWARD_USD, 50),
    rewardKrw: readPositiveInt(process.env.REVIEW_REWARD_KRW, 70_000),
    bodyMinLen: readPositiveInt(process.env.REVIEW_BODY_MIN_LEN, 20),
    bodyMaxLen: readPositiveInt(process.env.REVIEW_BODY_MAX_LEN, 1000),
    titleMaxLen: 50,
  } as const;
}

export type ReviewConfig = ReturnType<typeof getReviewConfig>;
