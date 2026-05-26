import { NextRequest, NextResponse } from "next/server";
import { logAdminAction } from "@/lib/admin/audit";
import { guardAdminApi } from "@/lib/admin/guard";
import { maskEmail, maskName, maskPhone } from "@/lib/admin/format";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAID_STATUSES = new Set(["paid", "paid_pending_key"]);

type OrderRow = {
  user_provider: string | null;
  user_provider_account_id: string | null;
  user_email: string | null;
  contact_email: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  amount: number | null;
  status: string;
  created_at: string;
};

type MemberRow = {
  provider: string;
  providerAccountId: string;
  email: string | null;
  buyerName: string | null;
  buyerPhone: string | null;
  orderCount: number;
  paidCount: number;
  cumulativeKrw: number;
  firstOrderAt: string;
  lastOrderAt: string;
};

const HEADERS = [
  "provider",
  "provider_account_id",
  "이메일(마스킹)",
  "이름(마스킹)",
  "전화(마스킹)",
  "주문수",
  "결제완료수",
  "누적결제(KRW)",
  "첫주문",
  "최근주문",
];

function csvCell(v: unknown): string {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const guard = await guardAdminApi(req);
  if (!guard.ok) return guard.response;

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 503 });
  }

  const { data } = await supabase
    .from("orders")
    .select(
      "user_provider,user_provider_account_id,user_email,contact_email,buyer_name,buyer_phone,amount,status,created_at"
    )
    .order("created_at", { ascending: false })
    .limit(10000);

  const rows = (data || []) as OrderRow[];
  const byMember = new Map<string, MemberRow>();
  for (const row of rows) {
    const provider = row.user_provider || "unknown";
    const accountId = row.user_provider_account_id || row.user_email || row.contact_email;
    if (!accountId) continue;
    const key = `${provider}:${accountId}`;
    const isPaid = PAID_STATUSES.has(row.status);
    const amount = Number(row.amount) || 0;

    const prev = byMember.get(key);
    if (!prev) {
      byMember.set(key, {
        provider,
        providerAccountId: String(accountId),
        email: row.user_email || row.contact_email,
        buyerName: row.buyer_name,
        buyerPhone: row.buyer_phone,
        orderCount: 1,
        paidCount: isPaid ? 1 : 0,
        cumulativeKrw: isPaid ? amount : 0,
        firstOrderAt: row.created_at,
        lastOrderAt: row.created_at,
      });
    } else {
      prev.orderCount += 1;
      if (isPaid) {
        prev.paidCount += 1;
        prev.cumulativeKrw += amount;
      }
      if (row.created_at < prev.firstOrderAt) prev.firstOrderAt = row.created_at;
      if (row.created_at > prev.lastOrderAt) prev.lastOrderAt = row.created_at;
      if (!prev.email && (row.user_email || row.contact_email)) {
        prev.email = row.user_email || row.contact_email;
      }
      if (!prev.buyerName && row.buyer_name) prev.buyerName = row.buyer_name;
      if (!prev.buyerPhone && row.buyer_phone) prev.buyerPhone = row.buyer_phone;
    }
  }

  const members = Array.from(byMember.values()).sort((a, b) =>
    b.lastOrderAt.localeCompare(a.lastOrderAt)
  );

  const csvLines: string[] = [HEADERS.map(csvCell).join(",")];
  for (const m of members) {
    csvLines.push(
      [
        m.provider,
        m.providerAccountId,
        maskEmail(m.email),
        maskName(m.buyerName),
        maskPhone(m.buyerPhone),
        m.orderCount,
        m.paidCount,
        Math.trunc(m.cumulativeKrw),
        m.firstOrderAt,
        m.lastOrderAt,
      ]
        .map(csvCell)
        .join(",")
    );
  }

  await logAdminAction({
    email: guard.session.admin_email,
    action: "MEMBERS_CSV_EXPORT",
    targetType: "members_aggregate",
    payload: { count: members.length },
    req,
  });

  // BOM + UTF-8 so Excel renders Hangul correctly.
  const body = "﻿" + csvLines.join("\n");
  const filename = `clcocloud_members_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
