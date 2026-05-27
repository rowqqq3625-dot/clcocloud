import { cookies } from "next/headers";
import { ADMIN_CSRF_COOKIE } from "@/lib/admin/config";
import { issueCsrfTokenOnCookieJar } from "@/lib/admin/csrf";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { KeyRowSafe } from "@/lib/vending/types";
import { KeysPageClient } from "./KeysPageClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAFE_COLUMNS =
  "id,plan_id,product_code,key_fingerprint,key_preview,status,memo,created_by,reserved_at,reserved_order_id,issued_at,issued_order_no,issued_order_id,revoked_at,revoked_reason,created_at,updated_at";

type SearchParams = { [key: string]: string | string[] | undefined };

function s(v: SearchParams[string]): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v ?? undefined;
}

export default async function KeysPage({ searchParams }: { searchParams: SearchParams }) {
  const cookieJar = cookies();
  const csrfToken = cookieJar.get(ADMIN_CSRF_COOKIE)?.value || issueCsrfTokenOnCookieJar(cookieJar);

  const status = s(searchParams.status);
  const planCode = s(searchParams.plan_code);
  const search = s(searchParams.search);
  const page = Math.max(1, Number(s(searchParams.page) || 1));
  const pageSize = Math.min(200, Math.max(10, Number(s(searchParams.pageSize) || 50)));

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return <p className="text-xs text-cream/60">Supabase 환경변수 미설정</p>;
  }

  let query = supabase.from("api_key_inventory").select(SAFE_COLUMNS, { count: "exact" });
  if (status) query = query.eq("status", status);
  if (planCode) query = query.eq("product_code", planCode);
  if (search) query = query.or(`issued_order_no.ilike.%${search}%,memo.ilike.%${search}%,key_preview.ilike.%${search}%`);
  query = query.order("created_at", { ascending: false });
  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data, count } = await query;
  const rows = (data || []) as KeyRowSafe[];

  const { data: plansData } = await supabase
    .from("plans")
    .select("id,code,name_ko,price_krw,active,created_at,updated_at")
    .order("price_krw");

  const baseHref = new URL("/admin-panel/vending/keys", "http://x");
  if (status) baseHref.searchParams.set("status", status);
  if (planCode) baseHref.searchParams.set("plan_code", planCode);
  if (search) baseHref.searchParams.set("search", search);
  const baseHrefStr = `${baseHref.pathname}${baseHref.search}`;

  return (
    <div className="grid gap-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cream/40">VENDING / KEYS</p>
          <h1 className="mt-1 text-xl font-bold">키 목록</h1>
          <p className="mt-1 text-[11px] text-cream/50">총 {count ?? 0}건. 필터·정렬·페이지네이션 지원.</p>
        </div>
      </header>

      <KeysPageClient
        rows={rows}
        total={count ?? 0}
        page={page}
        pageSize={pageSize}
        baseHref={baseHrefStr}
        plans={(plansData || []) as any}
        csrfToken={csrfToken}
        currentFilters={{ status, plan_code: planCode, search }}
      />
    </div>
  );
}
