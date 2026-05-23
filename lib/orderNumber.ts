import { supabaseAdmin as supabase } from "./supabase/server";

function getFormattedDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export async function generateOrderNo(): Promise<string> {
  const dateStr = getFormattedDate();
  if (!supabase) {
    // Fallback if supabase not configured yet
    return `CLC-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  
  const prefix = `CLC-${dateStr}-`;
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .like("order_no", `${prefix}%`);
    
  const nextNum = (count || 0) + 1;
  const suffix = String(nextNum).padStart(4, "0");
  
  // To avoid race conditions causing duplicate keys, verify/fallback
  return `${prefix}${suffix}`;
}

export async function generateInquiryNo(): Promise<string> {
  const dateStr = getFormattedDate();
  if (!supabase) {
    return `INQ-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  
  const prefix = `INQ-${dateStr}-`;
  const { count, error } = await supabase
    .from("topup_inquiries")
    .select("id", { count: "exact", head: true })
    .like("inquiry_no", `${prefix}%`);
    
  const nextNum = (count || 0) + 1;
  const suffix = String(nextNum).padStart(4, "0");
  
  return `${prefix}${suffix}`;
}
