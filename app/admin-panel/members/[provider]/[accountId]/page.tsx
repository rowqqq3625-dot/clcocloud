import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerNotes } from "@/components/admin/CustomerNotes";
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

const PAID_STATUSES = new Set(["paid", "paid_pending_key"]);

type PageProps = {
  params: { provider: string; accountId: string };
};

type OrderRow = {
  id: string;
  order_no: string;
  product_kind: string | null;
  product_code: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  user_email: string | null;
  contact_email: string | null;
  amount: number | null;
  status: string;
  pay_method: string | null;
  paid_at: string | null;
  created_at: string;
};

type IssuedKeyRow = {
  id: string;
  order_id: string;
  fp16: string | null;
  last4: string | null;
  initial_balance: number | string | null;
  issued_at: string | null;
};

type AlimtalkRow = {
  id: string;
  order_id: string;
  template_code: string;
  recipient: string;
  result: string;
  sent_at: string;
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

async function loadMember({ provider, accountId }: { provider: string; accountId: string }) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data: orderRows } = await supabase
    .from("orders")
    .select(
      "id,order_no,product_kind,product_code,buyer_name,buyer_phone,user_email,contact_email,amount,status,pay_method,paid_at,created_at"
    )
    .eq("user_provider", provider)
    .eq("user_provider_account_id", accountId)
    .order("created_at", { ascending: false })
    .limit(500);

  const orders = (orderRows || []) as OrderRow[];
  if (orders.length === 0) {
    // The member key only "exists" if at least one order references it. We
    // could also accept members with zero orders, but for now they aren't
    // meaningfully addressable.
    return { exists: false as const };
  }

  // Collect the set of identifiers this customer has ever used. Used to match
  // tables that aren't keyed by provider/account_id.
  const emails = new Set<string>();
  const phones = new Set<string>();
  const names = new Set<string>();
  for (const order of orders) {
    if (order.user_email) emails.add(order.user_email.toLowerCase());
    if (order.contact_email) emails.add(order.contact_email.toLowerCase());
    if (order.buyer_phone) phones.add(order.buyer_phone);
    if (order.buyer_name) names.add(order.buyer_name);
  }

  const emailList = Array.from(emails);
  const phoneList = Array.from(phones);

  const [
    { data: issuedKeyRows },
    { data: alimtalkRows },
    { data: balanceRows },
    { data: topupRows },
  ] = await Promise.all([
    supabase
      .from("issued_api_keys")
      .select("id,order_id,fp16,last4,initial_balance,issued_at")
      .in("order_id", orders.map((o) => o.id)),
    supabase
      .from("alimtalk_logs")
      .select("id,order_id,template_code,recipient,result,sent_at")
      .in("order_id", orders.map((o) => o.id))
      .order("sent_at", { ascending: false })
      .limit(200),
    emailList.length > 0
      ? supabase
          .from("balance_requests")
          .select("id,contact_email,request_amount,message,status,admin_note,created_at,updated_at")
          .in(
            "contact_email",
            emailList.flatMap((e) => [e, e.toUpperCase()])
          )
          .order("created_at", { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] }),
    phoneList.length > 0
      ? supabase
          .from("topup_inquiries")
          .select("id,inquiry_no,desired_usd,amount_krw,buyer_name,buyer_phone,memo,status,created_at")
          .in("buyer_phone", phoneList)
          .order("created_at", { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] }),
  ]);

  const issuedKeys = (issuedKeyRows || []) as IssuedKeyRow[];
  const alimtalkLogs = (alimtalkRows || []) as AlimtalkRow[];
  const balanceRequests = (balanceRows || []) as BalanceRequestRow[];
  const topupInquiries = (topupRows || []) as TopupInquiryRow[];

  const issuedKeysByOrder = new Map<string, IssuedKeyRow[]>();
  for (const row of issuedKeys) {
    const list = issuedKeysByOrder.get(row.order_id) || [];
    list.push(row);
    issuedKeysByOrder.set(row.order_id, list);
  }

  const cumulative = orders
    .filter((o) => PAID_STATUSES.has(o.status))
    .reduce((acc, o) => acc + (Number(o.amount) || 0), 0);
  const paidCount = orders.filter((o) => PAID_STATUSES.has(o.status)).length;
  const lastPaid = orders.find((o) => PAID_STATUSES.has(o.status));

  return {
    exists: true as const,
    orders,
    issuedKeys,
    issuedKeysByOrder,
    alimtalkLogs,
    balanceRequests,
    topupInquiries,
    emails: emailList,
    phones: phoneList,
    names: Array.from(names),
    cumulative,
    paidCount,
    firstOrderAt: orders[orders.length - 1]?.created_at ?? null,
    lastOrderAt: orders[0]?.created_at ?? null,
    lastPaidAt: lastPaid?.paid_at ?? null,
  };
}

const STATUS_LABEL: Record<string, string> = {
  pending: "결제대기",
  paid: "결제완료",
  paid_pending_key: "키발급대기",
  failed: "실패",
  cancelled: "취소",
  refunded: "환불",
};

const STATUS_TONE: Record<string, string> = {
  pending: "bg-cream/10 text-cream/70",
  paid: "bg-emerald-500/15 text-emerald-300",
  paid_pending_key: "bg-amber-500/15 text-amber-300",
  failed: "bg-[#D97757]/15 text-[#F0E2D2]",
  cancelled: "bg-cream/10 text-cream/50",
  refunded: "bg-[#D97757]/15 text-[#F0E2D2]",
};

function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] || "bg-cream/10 text-cream/70";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] ${tone}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function Card({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-cream/10 bg-[#1F1E1D]/80 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/40">{label}</p>
      <p className="mt-2 text-lg font-bold text-cream/90">{value}</p>
      {hint ? <p className="mt-1 text-[10px] text-cream/40">{hint}</p> : null}
    </div>
  );
}

export default async function MemberDetailPage({ params }: PageProps) {
  const provider = decodeURIComponent(params.provider);
  const accountId = decodeURIComponent(params.accountId);

  const member = await loadMember({ provider, accountId });
  if (!member) {
    return (
      <p className="rounded-2xl border border-[#D97757]/25 bg-[#D97757]/10 px-5 py-4 text-sm font-semibold text-[#F0E2D2]">
        Supabase 환경변수 설정이 필요합니다.
      </p>
    );
  }
  if (!member.exists) {
    notFound();
  }

  const primaryEmail = member.emails[0] || null;
  const primaryName = member.names[0] || null;
  const primaryPhone = member.phones[0] || null;

  return (
    <div className="grid gap-6">
      <nav className="text-[11px]">
        <Link href="/admin-panel/members" className="text-cream/50 hover:text-cream">
          ← 회원 목록
        </Link>
      </nav>

      <header className="grid gap-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cream/40">CUSTOMER 360°</p>
        <h1 className="text-xl font-bold">{maskName(primaryName)}</h1>
        <p className="font-mono text-[11px] text-cream/60">
          {provider.toUpperCase()} · {accountId}
        </p>
        <p className="text-[11px] text-cream/55">
          {maskEmail(primaryEmail)} · {maskPhone(primaryPhone)}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label="누적 결제" value={formatKrw(member.cumulative)} hint={`${member.paidCount}건 결제완료`} />
        <Card label="총 주문" value={member.orders.length.toLocaleString("ko-KR")} />
        <Card
          label="첫 주문 / 최근"
          value={
            member.firstOrderAt && member.lastOrderAt
              ? `${formatKstDateTime(member.firstOrderAt).slice(0, 10)} → ${formatKstDateTime(
                  member.lastOrderAt
                ).slice(0, 10)}`
              : "—"
          }
        />
        <Card
          label="발급 API 키"
          value={member.issuedKeys.length.toLocaleString("ko-KR")}
          hint="키 원문은 콘솔에 노출되지 않음"
        />
      </div>

      {/* 식별자 묶음 */}
      <section className="rounded-2xl border border-cream/10 bg-[#1F1E1D]/60 p-5">
        <h2 className="mb-3 text-sm font-bold text-cream/80">식별자</h2>
        <dl className="grid gap-2 text-[11px]">
          <Row label="OAuth Provider">
            <span className="font-mono text-cream/85">{provider}</span>
          </Row>
          <Row label="Provider Account ID">
            <span className="font-mono text-cream/85">{accountId}</span>
          </Row>
          <Row label="이메일">
            <div className="grid gap-0.5">
              {member.emails.length === 0 ? <span className="text-cream/40">—</span> : null}
              {member.emails.map((e) => (
                <span key={e} className="font-mono text-cream/85">
                  {maskEmail(e)}
                </span>
              ))}
            </div>
          </Row>
          <Row label="이름">
            <div className="grid gap-0.5">
              {member.names.length === 0 ? <span className="text-cream/40">—</span> : null}
              {member.names.map((n) => (
                <span key={n} className="text-cream/85">
                  {maskName(n)}
                </span>
              ))}
            </div>
          </Row>
          <Row label="전화번호">
            <div className="grid gap-0.5">
              {member.phones.length === 0 ? <span className="text-cream/40">—</span> : null}
              {member.phones.map((p) => (
                <span key={p} className="font-mono text-cream/85">
                  {maskPhone(p)}
                </span>
              ))}
            </div>
          </Row>
        </dl>
      </section>

      {/* 주문 이력 */}
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-bold text-cream/80">주문 이력</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream/40">
            {member.orders.length}건
          </span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-cream/10 bg-[#1F1E1D]/70">
          <table className="w-full table-fixed text-left text-xs">
            <thead className="bg-[#15140F] text-[10px] uppercase tracking-[0.16em] text-cream/40">
              <tr>
                <th className="w-[20%] px-3 py-2 font-mono">주문번호</th>
                <th className="w-[14%] px-3 py-2 font-mono">상품</th>
                <th className="w-[14%] px-3 py-2 font-mono text-right">금액</th>
                <th className="w-[10%] px-3 py-2 font-mono">상태</th>
                <th className="w-[12%] px-3 py-2 font-mono">결제수단</th>
                <th className="w-[10%] px-3 py-2 font-mono text-right">발급키</th>
                <th className="w-[20%] px-3 py-2 font-mono">생성</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream/5 text-cream/85">
              {member.orders.map((order) => {
                const issued = member.issuedKeysByOrder.get(order.id) || [];
                return (
                  <tr key={order.id}>
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin-panel/orders?orderId=${order.id}`}
                        className="font-mono text-[11px] text-cream hover:text-[#D97757]"
                      >
                        {order.order_no}
                      </Link>
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px]">{order.product_code || "—"}</td>
                    <td className="px-3 py-2 font-mono tabular-nums text-right">
                      {formatKrw(order.amount)}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-3 py-2 font-mono text-[10px] text-cream/70">
                      {order.pay_method || "—"}
                    </td>
                    <td className="px-3 py-2 font-mono tabular-nums text-right text-cream/70">
                      {issued.length || "—"}
                    </td>
                    <td className="px-3 py-2 font-mono text-[10px] text-cream/70">
                      {formatKstDateTime(order.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 잔액 추가요청 (이메일 매칭) */}
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-bold text-cream/80">잔액 추가요청 (이메일 매칭)</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream/40">
            {member.balanceRequests.length}건
          </span>
        </div>
        {member.balanceRequests.length === 0 ? (
          <p className="rounded-xl border border-cream/10 bg-[#15140F]/40 px-4 py-3 text-[11px] text-cream/40">
            연동된 잔액 추가요청이 없습니다.
          </p>
        ) : (
          <ul className="grid gap-2">
            {member.balanceRequests.map((row) => (
              <li
                key={row.id}
                className="rounded-xl border border-cream/10 bg-[#15140F]/40 px-3 py-2 text-[11px]"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-cream/85">{maskEmail(row.contact_email)}</span>
                    <span className="font-mono tabular-nums text-cream/60">
                      {row.request_amount ? `$${row.request_amount}` : "—"}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-cream/50">
                    {formatKstDateTime(row.updated_at || row.created_at)}
                  </span>
                </div>
                {row.message ? (
                  <p className="mt-1 text-cream/65">{row.message}</p>
                ) : null}
                {row.admin_note ? (
                  <p className="mt-1 text-cream/50">관리자 메모: {row.admin_note}</p>
                ) : null}
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-cream/40">
                  status: {row.status}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 잔액충전 문의 (전화번호 매칭) */}
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-bold text-cream/80">잔액충전 문의 (전화번호 매칭)</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream/40">
            {member.topupInquiries.length}건
          </span>
        </div>
        {member.topupInquiries.length === 0 ? (
          <p className="rounded-xl border border-cream/10 bg-[#15140F]/40 px-4 py-3 text-[11px] text-cream/40">
            연동된 잔액충전 문의가 없습니다.
          </p>
        ) : (
          <ul className="grid gap-2">
            {member.topupInquiries.map((row) => (
              <li key={row.id} className="rounded-xl border border-cream/10 bg-[#15140F]/40 px-3 py-2 text-[11px]">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-cream/85">{row.inquiry_no || "—"}</span>
                    <span className="font-mono tabular-nums text-cream/60">
                      {row.desired_usd ? `$${row.desired_usd}` : "—"}
                    </span>
                    <span className="font-mono tabular-nums text-cream/50">
                      {formatKrw(row.amount_krw)}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-cream/50">
                    {formatKstDateTime(row.created_at)}
                  </span>
                </div>
                {row.memo ? <p className="mt-1 text-cream/65">{row.memo}</p> : null}
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-cream/40">
                  status: {row.status}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 알림톡 이력 */}
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-bold text-cream/80">알림톡 발송 이력</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream/40">
            {member.alimtalkLogs.length}건 (최근 200)
          </span>
        </div>
        {member.alimtalkLogs.length === 0 ? (
          <p className="rounded-xl border border-cream/10 bg-[#15140F]/40 px-4 py-3 text-[11px] text-cream/40">
            발송 이력이 없습니다.
          </p>
        ) : (
          <ul className="grid gap-1.5">
            {member.alimtalkLogs.map((log) => (
              <li
                key={log.id}
                className="flex items-center justify-between rounded-xl border border-cream/10 bg-[#15140F]/40 px-3 py-2 text-[11px]"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-cream/85">{log.template_code}</span>
                  <span className="font-mono text-[10px] text-cream/50">
                    {log.recipient === "buyer" ? "구매자" : "운영자"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      log.result === "success"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-[#D97757]/15 text-[#F0E2D2]"
                    }`}
                  >
                    {log.result === "success" ? "성공" : "실패"}
                  </span>
                  <span className="font-mono text-[10px] text-cream/50">
                    {formatKstDateTime(log.sent_at)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <CustomerNotes provider={provider} accountId={accountId} />

      <p className="text-[10px] text-cream/40">
        * 이름/이메일/전화번호 표시는 PII 마스킹 정책을 따릅니다. 메모는 admin_audit_logs 와 함께 보관됩니다.
      </p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-3">
      <dt className="text-[10px] uppercase tracking-[0.16em] text-cream/40">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
