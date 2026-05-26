import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SecurityEvent = {
  id: string;
  event_type: string;
  email: string | null;
  country: string | null;
  created_at: string;
};

type AuditLog = {
  id: string;
  admin_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
};

export default async function AdminSecurityPage() {
  const supabase = getSupabaseAdminClient();
  let events: SecurityEvent[] = [];
  let audits: AuditLog[] = [];

  if (supabase) {
    const [{ data: eventsData }, { data: auditsData }] = await Promise.all([
      supabase
        .from("admin_security_events")
        .select("id,event_type,email,country,created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("admin_audit_logs")
        .select("id,admin_email,action,target_type,target_id,created_at")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    events = (eventsData || []) as SecurityEvent[];
    audits = (auditsData || []) as AuditLog[];
  }

  return (
    <div className="grid gap-6">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cream/40">SECURITY</p>
        <h1 className="mt-1 text-xl font-bold">보안 / 감사</h1>
      </header>

      <section>
        <h2 className="mb-2 text-sm font-bold text-cream/80">최근 보안 이벤트</h2>
        <div className="overflow-hidden rounded-2xl border border-cream/10 bg-[#1F1E1D]/70">
          <table className="w-full table-fixed text-left text-xs">
            <thead className="bg-[#15140F] text-[10px] uppercase tracking-[0.16em] text-cream/40">
              <tr>
                <th className="px-3 py-2 font-mono">시각</th>
                <th className="px-3 py-2 font-mono">유형</th>
                <th className="px-3 py-2 font-mono">이메일</th>
                <th className="px-3 py-2 font-mono">국가</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream/5 text-cream/80">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-cream/40">
                    이벤트가 없습니다.
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id}>
                    <td className="px-3 py-2 font-mono text-[10px]">{new Date(event.created_at).toISOString()}</td>
                    <td className="px-3 py-2">{event.event_type}</td>
                    <td className="px-3 py-2">{event.email || "—"}</td>
                    <td className="px-3 py-2 font-mono">{event.country || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-cream/80">최근 감사 로그</h2>
        <div className="overflow-hidden rounded-2xl border border-cream/10 bg-[#1F1E1D]/70">
          <table className="w-full table-fixed text-left text-xs">
            <thead className="bg-[#15140F] text-[10px] uppercase tracking-[0.16em] text-cream/40">
              <tr>
                <th className="px-3 py-2 font-mono">시각</th>
                <th className="px-3 py-2 font-mono">관리자</th>
                <th className="px-3 py-2 font-mono">액션</th>
                <th className="px-3 py-2 font-mono">대상</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream/5 text-cream/80">
              {audits.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-cream/40">
                    감사 로그가 없습니다.
                  </td>
                </tr>
              ) : (
                audits.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2 font-mono text-[10px]">{new Date(row.created_at).toISOString()}</td>
                    <td className="px-3 py-2">{row.admin_email || "—"}</td>
                    <td className="px-3 py-2">{row.action}</td>
                    <td className="px-3 py-2">
                      {row.target_type ? `${row.target_type}:${row.target_id || ""}` : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
