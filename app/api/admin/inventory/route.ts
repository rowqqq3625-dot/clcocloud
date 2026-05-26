import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction } from "@/lib/admin/audit";
import { guardAdminApi } from "@/lib/admin/guard";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getFingerprint } from "@/lib/fingerprint";
import { encryptKey } from "@/lib/keyEncryption";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PostSchema = z.object({
  keys: z.array(z.string().min(1)).min(1),
  productCode: z.string().min(1),
  initialBalance: z.union([z.string(), z.number()]),
});

const DeleteSchema = z.object({
  id: z.string().min(1),
  reason: z.string().trim().min(4).max(1000).optional(),
});

export async function GET(req: NextRequest) {
  const guard = await guardAdminApi(req);
  if (!guard.ok) return guard.response;

  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 503 });
    }

    const { data: inventory, error: invError } = await supabase
      .from("api_key_inventory")
      .select("id, fp16, last4, product_code, status, reserved_at, issued_at, created_at")
      .order("created_at", { ascending: false });

    if (invError) {
      return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
    }

    const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentIssued } = await supabase
      .from("api_key_inventory")
      .select("product_code")
      .eq("status", "issued")
      .gte("issued_at", past24h);

    const stats: Record<string, { available: number; reserved: number; issued: number; recent24h: number }> = {};
    const plans = ["STANDARD", "PRO", "ULTRA"];
    plans.forEach((plan) => {
      stats[plan] = { available: 0, reserved: 0, issued: 0, recent24h: 0 };
    });

    inventory?.forEach((item) => {
      const code = item.product_code;
      if (!stats[code]) {
        stats[code] = { available: 0, reserved: 0, issued: 0, recent24h: 0 };
      }
      if (item.status === "available") stats[code].available++;
      else if (item.status === "reserved") stats[code].reserved++;
      else if (item.status === "issued") stats[code].issued++;
    });

    recentIssued?.forEach((item) => {
      const code = item.product_code;
      if (stats[code]) stats[code].recent24h++;
    });

    return NextResponse.json({ success: true, inventory, stats });
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
  const { keys, productCode, initialBalance } = parsed.data;

  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 503 });
    }

    const insertRows: Array<Record<string, unknown>> = [];
    const duplicates: string[] = [];

    for (const rawKey of keys) {
      const trimmed = rawKey.trim();
      if (!trimmed) continue;

      const { fp_full, fp16, last4 } = getFingerprint(trimmed);

      const { data: existing } = await supabase
        .from("api_key_inventory")
        .select("id")
        .eq("fp_full", fp_full)
        .maybeSingle();

      if (existing) {
        duplicates.push(`${fp16}...${last4}`);
        continue;
      }

      const encrypted = encryptKey(trimmed);

      insertRows.push({
        fp_full,
        fp16,
        last4,
        raw_key_encrypted: encrypted,
        initial_balance: initialBalance,
        product_code: productCode,
        status: "available",
      });
    }

    if (insertRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "등록할 수 있는 신규 키가 없습니다. (전부 중복이거나 빈 입력값)",
          duplicates,
        },
        { status: 400 }
      );
    }

    const { error: insertError } = await supabase
      .from("api_key_inventory")
      .insert(insertRows);

    if (insertError) {
      return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
    }

    await logAdminAction({
      email: guard.session.admin_email,
      action: "INVENTORY_INSERT",
      targetType: "api_key_inventory",
      payload: { productCode, count: insertRows.length, duplicates },
      req,
    });

    return NextResponse.json({ success: true, insertedCount: insertRows.length, duplicates });
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
  const { id, reason } = parsed.data;

  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 503 });
    }

    const { data: keyCheck } = await supabase
      .from("api_key_inventory")
      .select("status")
      .eq("id", id)
      .single();

    if (!keyCheck) {
      return NextResponse.json({ error: "해당 키를 찾을 수 없습니다." }, { status: 404 });
    }

    if (keyCheck.status !== "available") {
      return NextResponse.json(
        { error: "사용 가능(available) 상태인 키만 삭제할 수 있습니다." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("api_key_inventory")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
    }

    await logAdminAction({
      email: guard.session.admin_email,
      action: "INVENTORY_DELETE",
      targetType: "api_key_inventory",
      targetId: id,
      payload: { reason: reason ?? null },
      req,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
