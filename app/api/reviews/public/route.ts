import { NextResponse } from "next/server";
import { getSupabaseAdminClient, type PublicReviewRecord } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ reviews: [] });

  const { data, error } = await supabase
    .from("reviews")
    .select("id,rating,body,masked_name,created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(24);

  if (error) return NextResponse.json({ reviews: [] });
  return NextResponse.json({ reviews: (data || []) as PublicReviewRecord[] });
}
