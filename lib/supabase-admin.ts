import "server-only";
import { createClient } from "@supabase/supabase-js";

export type OrderStatus = "pending" | "paid" | "issued";
export type ReviewStatus = "pending" | "approved" | "rejected";
export type BonusStatus = "none" | "pending" | "paid";
export type BalanceRequestStatus = "pending" | "answered" | "fulfilled" | "rejected";

export type DashboardKeyRecord = {
  id: string;
  user_provider: string;
  user_provider_account_id: string;
  encrypted_api_key: string;
  api_key_fingerprint: string;
  masked_api_key: string;
  last_status: string | null;
  last_balance: number | null;
  last_spend_cap: number | null;
  last_rpm: number | null;
  last_checked_at: string;
  created_at: string;
  updated_at: string;
};

export type OrderRecord = {
  id: string;
  user_provider: string;
  user_provider_account_id: string;
  user_email: string | null;
  contact_email: string;
  plan_id: string;
  plan_name: string;
  balance_usd: number;
  price_krw: number;
  os_targets: string[] | null;
  status: OrderStatus;
  created_at: string;
};

export type ReviewRecord = {
  id: string;
  order_id: string;
  user_provider: string;
  user_provider_account_id: string;
  rating: number;
  body: string;
  display_name: string;
  masked_name: string;
  status: ReviewStatus;
  bonus_status: BonusStatus;
  created_at: string;
  reviewed_at: string | null;
};

export type PublicReviewRecord = Pick<ReviewRecord, "id" | "rating" | "body" | "masked_name" | "created_at">;

export type BalanceRequestRecord = {
  id: string;
  user_provider: string;
  user_provider_account_id: string;
  contact_email: string;
  request_amount: string;
  message: string;
  status: BalanceRequestStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

export function getSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
