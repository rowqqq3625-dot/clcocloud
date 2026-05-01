import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth-session";
import { maskDisplayName } from "@/lib/review-utils";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const reviewSchema = z.object({
  orderId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(10).max(600),
  displayName: z.string().trim().min(1).max(40)
});

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_review" }, { status: 400 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,status,user_provider,user_provider_account_id")
    .eq("id", parsed.data.orderId)
    .eq("user_provider", session.provider)
    .eq("user_provider_account_id", session.providerAccountId)
    .maybeSingle();

  if (orderError) return NextResponse.json({ error: "order_lookup_failed" }, { status: 500 });
  if (!order) return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  if (order.status !== "issued") return NextResponse.json({ error: "order_not_issued" }, { status: 409 });

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("order_id", parsed.data.orderId)
    .maybeSingle();
  if (existing) return NextResponse.json({ error: "review_already_exists" }, { status: 409 });

  const displayName = parsed.data.displayName.trim();
  const review = {
    order_id: parsed.data.orderId,
    user_provider: session.provider,
    user_provider_account_id: session.providerAccountId,
    rating: parsed.data.rating,
    body: parsed.data.body,
    display_name: displayName,
    masked_name: maskDisplayName(displayName),
    status: "pending" as const,
    bonus_status: "pending" as const
  };

  const { data, error } = await supabase
    .from("reviews")
    .insert(review)
    .select("id,status,bonus_status,created_at")
    .single();

  if (error) return NextResponse.json({ error: "review_insert_failed" }, { status: 500 });
  return NextResponse.json({ review: data }, { status: 201 });
}
