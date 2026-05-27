import "server-only";

/**
 * Shared TypeScript shapes for the review system.
 *
 * These mirror the columns added/changed by
 * supabase/migrations/20260528_review_system.sql. The legacy fields
 * (display_name, masked_name, bonus_status, reviewed_at) are kept here
 * because the existing /api/reviews and /mypage code still reads them
 * — removing them would break those callers until the API layer
 * (phase 3) lands. New code should prefer the spec-aligned fields.
 */

export type ReviewStatus = "pending" | "approved" | "rejected" | "hidden";
export type BonusStatus = "none" | "pending" | "paid";

export type ReviewRow = {
  id: string;
  order_id: string;
  user_provider: string;
  user_provider_account_id: string;
  rating: number;
  title: string | null;
  body: string;
  display_name: string;
  masked_name: string;
  plan_code: string | null;
  status: ReviewStatus;
  bonus_status: BonusStatus;
  approved_at: string | null;
  approved_by: string | null;
  rejected_reason: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  hidden_at: string | null;
  hidden_by: string | null;
  reward_granted: boolean;
  reward_amount_usd: number;
  reward_granted_at: string | null;
  helpful_count: number;
  featured: boolean;
  featured_order: number | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
};

/** Subset safe for public consumption (no internal admin fields). */
export type PublicReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  masked_name: string;
  plan_code: string | null;
  featured: boolean;
  helpful_count: number;
  created_at: string;
};

/** Subset for the operator's "my reviews" page. Includes the user's own
 *  pending/rejected/hidden state and the latest reward info. */
export type MyReview = PublicReview & {
  status: ReviewStatus;
  display_name: string;
  rejected_reason: string | null;
  reward_granted: boolean;
  reward_amount_usd: number;
  reward_granted_at: string | null;
  order_id: string;
  updated_at: string;
};

/** Subset for the admin operations dashboard. Adds approver/rejecter
 *  identity, the raw order id for cross-linking, and audit timestamps. */
export type AdminReview = ReviewRow;

export type ReviewStats = {
  total_reviews_approved: number;
  avg_rating: number | null;
  rating_distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
  total_unique_buyers: number;
  repurchase_rate: number;
  total_orders_paid: number;
  recent_30d_reviews_count: number;
};

export type RewardLedgerRow = {
  id: string;
  review_id: string;
  user_provider: string;
  user_provider_account_id: string;
  amount_usd: number;
  amount_krw: number;
  credit_ledger_id: string | null;
  created_by: string;
  created_at: string;
  revoked_at: string | null;
  revoked_by: string | null;
  revoked_reason: string | null;
  revoke_credit_ledger_id: string | null;
};

export type CreditLedgerRow = {
  id: string;
  user_provider: string;
  user_provider_account_id: string;
  amount_usd: number;
  amount_krw: number;
  source: string;
  source_ref_type: string | null;
  source_ref_id: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
};

export type CreditBalance = {
  user_provider: string;
  user_provider_account_id: string;
  balance_usd: number;
  balance_krw: number;
  last_credit_at: string | null;
};

export type ReviewActionLogAction =
  | "REVIEW_SUBMIT"
  | "REVIEW_RESUBMIT"
  | "REVIEW_APPROVE"
  | "REVIEW_REJECT"
  | "REVIEW_HIDE"
  | "REVIEW_UNHIDE"
  | "REVIEW_FEATURE"
  | "REVIEW_UNFEATURE"
  | "REVIEW_HELPFUL_ADD"
  | "REVIEW_HELPFUL_REMOVE"
  | "REWARD_GRANT"
  | "REWARD_REVOKE"
  | "CASE_STUDY_CREATE"
  | "CASE_STUDY_UPDATE"
  | "CASE_STUDY_PUBLISH"
  | "CASE_STUDY_UNPUBLISH";

export type ReviewActionLog = {
  id: string;
  actor_admin_email: string | null;
  actor_user_provider: string | null;
  actor_user_provider_account_id: string | null;
  action: ReviewActionLogAction;
  target_review_id: string | null;
  target_case_study_id: string | null;
  before_state: unknown;
  after_state: unknown;
  created_at: string;
};

export type CaseStudyRow = {
  id: string;
  slug: string;
  review_id: string | null;
  title: string;
  summary: string;
  body_md: string;
  hero_image_url: string | null;
  customer_label: string | null;
  plan_code: string | null;
  metrics: Record<string, string | number>;
  published: boolean;
  published_at: string | null;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

/** Order shape returned by eligibility queries. */
export type EligibleOrder = {
  id: string;
  order_no: string;
  product_code: string;
  product_kind: string;
  amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  /** ISO timestamp at which the user becomes eligible to write a review
   *  for this order (paid_at + REVIEW_ELIGIBILITY_AFTER_DAYS). Null if
   *  paid_at is missing. */
  eligible_at: string | null;
  /** True iff eligible_at <= now AND no existing review on the order
   *  AND a key has been issued for this order. */
  is_eligible: boolean;
  /** When false but the cooldown is the only blocker, holds the human
   *  date the user can write a review. */
  cooldown_until: string | null;
  /** True if any review (any status) already exists for this order. */
  has_review: boolean;
  /** True if there is at least one issued_api_keys row for this order. */
  key_issued: boolean;
};
