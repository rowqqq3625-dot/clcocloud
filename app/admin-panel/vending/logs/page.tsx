import Link from "next/link";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { ActionLog } from "@/lib/vending/types";
import { LogDiffViewer } from "@/components/admin/vending/LogDiffViewer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SearchParams = { [key: string]: string | string[] | undefined };
function s(v: SearchParams[string]): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v ?? undefined;
}

const ACTIONS = [
  "", "KEY_REGISTER", "KEY_BULK_REGISTER", "KEY_UPDATE", "KEY_REVOKE",
  "KEY_RESERVE", "KEY_ISSUE", "KEY_RELEASE", "KEY_REISSUE",
  "MANUAL_ISSUE", "PLAN_UPSERT", "KEY_REVEAL",
];

export default async function LogsPage({ searchParams }: { searchParams: SearchParams }) {
  const action = s(searchParams.action);
  const orderNo = s(searchParams.order_no);
  const page = Math.max(1, Number(s(searchParams.page) || 1));
  const pageSize = 100;

  const supabase = getSupabaseAdminClient();
  if (!supabase) return <p className="text-xs text-cream/60">Supabase 환경변수 미설정</p>;

  let query = supabase
    .from("vending_action_logs")
    .select("id,actor_admin_id,action,target_key_id,target_order_no,plan_code,before_state,after_state,created_at", { count: "exact" });
  if (action) query = query.eq("action", action);
  if (orderNo) query = query.eq("target_order_no", orderNo);
  query = query.order("created_at", { ascending: false });
  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data, count } = await query;
  const rows = (data || []) as ActionLog[];
  const lastPage = Math.max(1, Math.ceil((count ?? 0) / pageSize));

  return (
    <div className="grid gap-5">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cream/40">VENDING / LOGS</p>
        <h1 className="mt-1 text-xl font-bold">활동 로그</h1>
        <p className="mt-1 text-[11px] text-cream/50">총 {(count ?? 0).toLocaleString()}건 · append-only.</p>
      </header>

      <form className="flex flex-wrap items-center gap-2 rounded-2xl border border-cream/10 bg-[#1F1E1D]/70 px-4 py-3" action="/admin-panel/vending/logs">
        <select name="action" defaultValue={action || ""} className="rounded-xl border border-cream/15 bg-black/40 px-3 py-1.5 text-xs">
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{a || "전체 액션"}</option>
          ))}
        </select>
        <input
          type="text"
          name="order_no"
          defaultValue={orderNo || ""}
          placeholder="주문번호"
          className="rounded-xl border border-cream/15 bg-black/40 px-3 py-1.5 text-xs font-mono"
        />
        <button type="submit" className="rounded-full bg-[#D97757] px-4 py-1.5 text-xs font-bold text-cream hover:bg-[#c5694b]">필터</button>
        <Link href="/admin-panel/vending/logs" className="rounded-full border border-cream/15 px-4 py-1.5 text-xs font-bold text-cream/80 hover:border-cream/40">초기화</Link>
      </form>

      <div className="overflow-hidden rounded-2xl border border-cream/10 bg-[#1F1E1D]/70">
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-xs text-cream/40">로그 없음.</p>
        ) : (
          <ul className="divide-y divide-cream/5">
            {rows.map((r) => (
              <li key={r.id} className="grid gap-2 px-4 py-3 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#F0E2D2]">{r.action}</span>
                  <span className="font-mono text-[10px] text-cream/50">{fmt(r.created_at)}</span>
                  {r.plan_code ? <span className="font-mono text-[10px] text-cream/60">plan: {r.plan_code}</span> : null}
                  {r.target_order_no ? <span className="font-mono text-[10px] text-cream/60">order: {r.target_order_no}</span> : null}
                  {r.target_key_id ? <span className="font-mono text-[10px] text-cream/60">key: {r.target_key_id.slice(0, 8)}…</span> : null}
                </div>
                <LogDiffViewer
                  before={r.before_state}
                  after={r.after_state}
                  action={r.action}
                  meta={{ actor: r.actor_admin_id, created_at: r.created_at, plan_code: r.plan_code, order_no: r.target_order_no }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {(count ?? 0) > pageSize ? (
        <div className="flex justify-center gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-cream/40">
          <PageLink action={action} orderNo={orderNo} page={Math.max(1, page - 1)} disabled={page === 1}>이전</PageLink>
          <span>{page} / {lastPage}</span>
          <PageLink action={action} orderNo={orderNo} page={Math.min(lastPage, page + 1)} disabled={page === lastPage}>다음</PageLink>
        </div>
      ) : null}
    </div>
  );
}

function PageLink({ action, orderNo, page, disabled, children }: { action?: string; orderNo?: string; page: number; disabled: boolean; children: React.ReactNode }) {
  if (disabled) return <span className="opacity-30">{children}</span>;
  const params = new URLSearchParams();
  if (action) params.set("action", action);
  if (orderNo) params.set("order_no", orderNo);
  params.set("page", String(page));
  return (
    <Link href={`/admin-panel/vending/logs?${params.toString()}`} className="hover:text-cream">
      {children}
    </Link>
  );
}

function fmt(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  } catch {
    return iso;
  }
}
