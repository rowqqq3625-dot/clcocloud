import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction } from "@/lib/admin/audit";
import { guardAdminApi } from "@/lib/admin/guard";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const numericLike = z.union([z.number(), z.string(), z.null()]).optional();

const BaseFields = {
  product_code: z.string().min(1).optional(),
  display_name: z.string().min(1).optional(),
  ai_partner: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  period_months: numericLike,
  included_balance: numericLike,
  price_krw: numericLike,
  original_price_krw: numericLike,
  is_featured: z.boolean().optional(),
  is_active: z.boolean().optional(),
  sort_order: numericLike,
};

const PostSchema = z.object({
  ...BaseFields,
  product_code: z.string().min(1),
  display_name: z.string().min(1),
  ai_partner: z.string().min(1),
});

const PutSchema = z.object({
  id: z.string().min(1),
  ...BaseFields,
});

const DeleteSchema = z.object({
  id: z.string().min(1),
});

function toNumberOrNull(value: number | string | null | undefined): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: NextRequest) {
  const guard = await guardAdminApi(req);
  if (!guard.ok) return guard.response;

  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 503 });
    }

    const { data, error } = await supabase
      .from("bundle_products")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await guardAdminApi(req);
  if (!guard.ok) return guard.response;

  const parsed = PostSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const body = parsed.data;

  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 503 });
    }

    const { data, error } = await supabase
      .from("bundle_products")
      .insert({
        product_code: body.product_code!.toUpperCase(),
        display_name: body.display_name,
        ai_partner: body.ai_partner,
        description: body.description ?? null,
        period_months: toNumberOrNull(body.period_months),
        included_balance: toNumberOrNull(body.included_balance),
        price_krw: toNumberOrNull(body.price_krw),
        original_price_krw: toNumberOrNull(body.original_price_krw),
        is_featured: body.is_featured === true,
        is_active: body.is_active === undefined ? true : body.is_active,
        sort_order: toNumberOrNull(body.sort_order) ?? 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
    }

    await logAdminAction({
      email: guard.session.admin_email,
      action: "BUNDLE_PRODUCT_INSERT",
      targetType: "bundle_product",
      targetId: data?.id ?? null,
      payload: { product_code: body.product_code },
      req,
    });

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const guard = await guardAdminApi(req);
  if (!guard.ok) return guard.response;

  const parsed = PutSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const body = parsed.data;

  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 503 });
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.product_code !== undefined) update.product_code = body.product_code.toUpperCase();
    if (body.display_name !== undefined) update.display_name = body.display_name;
    if (body.ai_partner !== undefined) update.ai_partner = body.ai_partner;
    if (body.description !== undefined) update.description = body.description;
    if (body.period_months !== undefined) update.period_months = toNumberOrNull(body.period_months);
    if (body.included_balance !== undefined) update.included_balance = toNumberOrNull(body.included_balance);
    if (body.price_krw !== undefined) update.price_krw = toNumberOrNull(body.price_krw);
    if (body.original_price_krw !== undefined) update.original_price_krw = toNumberOrNull(body.original_price_krw);
    if (body.is_featured !== undefined) update.is_featured = body.is_featured;
    if (body.is_active !== undefined) update.is_active = body.is_active;
    if (body.sort_order !== undefined) update.sort_order = toNumberOrNull(body.sort_order);

    const { data, error } = await supabase
      .from("bundle_products")
      .update(update)
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
    }

    await logAdminAction({
      email: guard.session.admin_email,
      action: "BUNDLE_PRODUCT_UPDATE",
      targetType: "bundle_product",
      targetId: body.id,
      payload: update,
      req,
    });

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const guard = await guardAdminApi(req);
  if (!guard.ok) return guard.response;

  const parsed = DeleteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { id } = parsed.data;

  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 503 });
    }

    const { error } = await supabase
      .from("bundle_products")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
    }

    await logAdminAction({
      email: guard.session.admin_email,
      action: "BUNDLE_PRODUCT_DELETE",
      targetType: "bundle_product",
      targetId: id,
      req,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
