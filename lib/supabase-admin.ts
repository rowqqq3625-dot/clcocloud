import "server-only";
import { createClient } from "@supabase/supabase-js";

export type OrderStatus = "pending" | "paid" | "issued";

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
  os_targets: string[];
  status: OrderStatus;
  created_at: string;
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
