import { BalanceRequestStatusActions } from "@/components/admin/BalanceRequestStatusActions";
import { InquiryStatusActions } from "@/components/admin/InquiryStatusActions";
import {
  formatKrw,
  formatKstDateTime,
  maskEmail,
  maskName,
  maskPhone,
} from "@/lib/admin/format";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TopupInquiryRow = {
  id: string;
  inquiry_no: string | null;
  desired_usd: number | null;
  amount_krw: number | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  memo: string | null;
  status: string;
  created_at: string;
};

type BalanceRequestRow = {
  id: string;
  contact_email: string | null;
  request_amount: number | string | null;
  message: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  updated_at: string | null;
};

const TOPUP_STATUS_TONE: Record<string, string> = {
  open: "bg-emerald-500/15 text-emerald-300",
  contacted: "bg-amber-500/15 text-amber-300",
  completed: "bg-cream/15 text-cream/80",
  closed: "bg-cream/10 text-cream/50",
};

const BALANCE_STATUS_TONE: Record<string, string> = {
  pending: "bg-emerald-500/15 text-emerald-300",
  answered: "bg-amber-500/15 text-amber-300",
  fulfilled: "bg-cream/15 text-cream/80",
  rejected: "bg-[#D97757]/15 text-[#F0E2D2]",
};

function Badge({ label, tone }: { label: string; tone: string }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] ${tone}`}>
      {label}
    </span>
  );
}

async function loadInquiries() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const [{ data: topupData }, { data: balanceData }] = await Promise.all([
    supabase
      .from("topup_inquiries")
      .select("id,inquiry_no,desired_usd,amount_krw,buyer_name,buyer_phone,memo,status,created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("balance_requests")
      .select("id,contact_email,request_amount,message,status,admin_note,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return {
    topup: (topupData || []) as TopupInquiryRow[],
    balance: (balanceData || []) as BalanceRequestRow[],
  };
}

export default async function AdminInquiriesPage() {
  const data = await loadInquiries();

  if (!data) {
    return (
      <div className="grid gap-6">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cream/40">INQUIRIES</p>
          <h1 className="mt-1 text-xl font-bold">문의 / CS</h1>
        </header>
        <p className="rounded-2xl border border-[#D97757]/25 bg-[#D97757]/10 px-5 py-4 text-sm font-semibold text-[#F0E2D2]">
          Supabase 환경변수 설정이 필요합니다.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cream/40">INQUIRIES</p>
        <h1 className="mt-1 text-xl font-bold">문의 / CS</h1>
        <p className="mt-1 text-[10px] text-cream/40">
          * 답변 작성은 후속 PR. 상태 변경은 우측 액션 버튼으로 즉시 수행되며 감사 로그에 기록됩니다.
        </p>
      </header>

      <section>
        <h2 className="mb-2 text-sm font-bold text-cream/80">잔액충전 문의 (topup_inquiries)</h2>
        <div className="overflow-hidden rounded-2xl border border-cream/10 bg-[#1F1E1D]/70">
          <table className="w-full table-fixed text-left text-xs">
            <thead className="bg-[#15140F] text-[10px] uppercase tracking-[0.16em] text-cream/40">
              <tr>
                <th className="w-[12%] px-3 py-2 font-mono">문의번호</th>
                <th className="w-[16%] px-3 py-2 font-mono">고객</th>
                <th className="w-[10%] px-3 py-2 font-mono text-right">희망 USD</th>
                <th className="w-[12%] px-3 py-2 font-mono text-right">금액</th>
                <th className="w-[10%] px-3 py-2 font-mono">상태</th>
                <th className="w-[14%] px-3 py-2 font-mono">메모</th>
                <th className="w-[12%] px-3 py-2 font-mono">접수</th>
                <th className="w-[14%] px-3 py-2 font-mono">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream/5 text-cream/85">
              {data.topup.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-cream/40">접수된 잔액충전 문의가 없습니다.</td>
                </tr>
              ) : (
                data.topup.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2 font-mono text-[10px]">{row.inquiry_no || "—"}</td>
                    <td className="px-3 py-2">
                      <div className="truncate">{maskName(row.buyer_name)}</div>
                      <div className="truncate text-[10px] text-cream/40">{maskPhone(row.buyer_phone)}</div>
                    </td>
                    <td className="px-3 py-2 font-mono tabular-nums text-right">
                      {row.desired_usd ? `$${row.desired_usd}` : "—"}
                    </td>
                    <td className="px-3 py-2 font-mono tabular-nums text-right">{formatKrw(row.amount_krw)}</td>
                    <td className="px-3 py-2">
                      <Badge label={row.status} tone={TOPUP_STATUS_TONE[row.status] || "bg-cream/10 text-cream/70"} />
                    </td>
                    <td className="px-3 py-2 truncate text-[11px] text-cream/70">{row.memo || "—"}</td>
                    <td className="px-3 py-2 font-mono text-[10px] text-cream/70">{formatKstDateTime(row.created_at)}</td>
                    <td className="px-3 py-2">
                      <InquiryStatusActions
                        id={row.id}
                        currentStatus={row.status as "open" | "contacted" | "completed" | "closed"}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-cream/80">잔액 추가요청 (balance_requests)</h2>
        <div className="overflow-hidden rounded-2xl border border-cream/10 bg-[#1F1E1D]/70">
          <table className="w-full table-fixed text-left text-xs">
            <thead className="bg-[#15140F] text-[10px] uppercase tracking-[0.16em] text-cream/40">
              <tr>
                <th className="w-[18%] px-3 py-2 font-mono">이메일</th>
                <th className="w-[10%] px-3 py-2 font-mono text-right">요청 USD</th>
                <th className="w-[20%] px-3 py-2 font-mono">요청 메시지</th>
                <th className="w-[18%] px-3 py-2 font-mono">관리자 메모</th>
                <th className="w-[8%] px-3 py-2 font-mono">상태</th>
                <th className="w-[12%] px-3 py-2 font-mono">최근 변경</th>
                <th className="w-[14%] px-3 py-2 font-mono">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream/5 text-cream/85">
              {data.balance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-cream/40">접수된 잔액 추가요청이 없습니다.</td>
                </tr>
              ) : (
                data.balance.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2 truncate">{maskEmail(row.contact_email)}</td>
                    <td className="px-3 py-2 font-mono tabular-nums text-right">
                      {row.request_amount ? `$${row.request_amount}` : "—"}
                    </td>
                    <td className="px-3 py-2 truncate text-[11px] text-cream/70">{row.message || "—"}</td>
                    <td className="px-3 py-2 truncate text-[11px] text-cream/70">{row.admin_note || "—"}</td>
                    <td className="px-3 py-2">
                      <Badge label={row.status} tone={BALANCE_STATUS_TONE[row.status] || "bg-cream/10 text-cream/70"} />
                    </td>
                    <td className="px-3 py-2 font-mono text-[10px] text-cream/70">
                      {formatKstDateTime(row.updated_at || row.created_at)}
                    </td>
                    <td className="px-3 py-2">
                      <BalanceRequestStatusActions
                        id={row.id}
                        currentStatus={row.status as "pending" | "answered" | "fulfilled" | "rejected"}
                        existingNote={row.admin_note}
                      />
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
