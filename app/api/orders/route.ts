import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth-session";
import { getPricingPlan } from "@/lib/pricing";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const orderSchema = z.object({
  planId: z.string().min(1),
  contactEmail: z.string().email(),
  osTargets: z.array(z.enum(["macOS", "Windows", "Linux"])).min(1).max(3)
});

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = orderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_order" }, { status: 400 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });

  const plan = getPricingPlan(parsed.data.planId);
  const order = {
    user_provider: session.provider,
    user_provider_account_id: session.providerAccountId,
    user_email: session.email || null,
    contact_email: parsed.data.contactEmail,
    plan_id: plan.id,
    plan_name: plan.name,
    balance_usd: plan.balance,
    price_krw: plan.price,
    os_targets: parsed.data.osTargets,
    status: "pending" as const
  };

  const { data, error } = await supabase.from("orders").insert(order).select("id,status,created_at").single();
  if (error) return NextResponse.json({ error: "order_insert_failed" }, { status: 500 });

  return NextResponse.json({ order: data }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderNo = searchParams.get("orderNo");

  if (!orderNo) {
    return NextResponse.json({ error: "orderNo_required" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }

  // 내부 식별자 및 원본 키 노출 방지
  const { data, error } = await supabase
    .from("orders")
    .select("order_no, status, product_kind, product_code, amount")
    .eq("order_no", orderNo)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }

  return NextResponse.json({ status: data.status, order: data });
}

