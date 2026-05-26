"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminOrderStatusActions } from "@/components/admin/AdminOrderStatusActions";
import { AlimtalkResendButton } from "@/components/admin/AlimtalkResendButton";

/**
 * Client-side phone formatter mirroring lib/admin/format.ts:maskPhone.
 * Inline here because format.ts is server-only.
 */
function formatPhone(input: string | null | undefined): string {
  if (!input) return "—";
  const digits = input.replace(/[^\d]/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    if (digits.startsWith("02")) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 9 && digits.startsWith("02")) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  return input;
}

type Order = {
  id: string;
  order_no: string;
  product_kind: string | null;
  product_code: string | null;
  amount: number | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  user_email: string | null;
  contact_email: string | null;
  status: string;
  pay_method: string | null;
  payapp_mul_no: string | null;
  paid_at: string | null;
  created_at: string;
};

type IssuedKey = {
  id: string;
  fp16: string | null;
  last4: string | null;
  initial_balance: number | null;
  issued_at: string | null;
};

type AlimtalkLog = {
  id: string;
  template_code: string;
  recipient: string;
  phone: string;
  result: string;
  sent_at: string;
};

type DetailPayload = {
  success?: boolean;
  order: Order;
  issuedKeys: IssuedKey[];
  alimtalkLogs: AlimtalkLog[];
};

const STATUS_LABEL: Record<string, string> = {
  pending: "결제대기",
  paid: "결제완료",
  paid_pending_key: "키발급대기",
  failed: "실패",
  cancelled: "취소",
  refunded: "환불",
};

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "paid"
      ? "bg-emerald-500/15 text-emerald-300"
      : status === "paid_pending_key"
      ? "bg-amber-500/15 text-amber-300"
      : status === "refunded" || status === "failed" || status === "cancelled"
      ? "bg-[#D97757]/15 text-[#F0E2D2]"
      : "bg-cream/10 text-cream/70";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] ${tone}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

export function AdminOrderDetailModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [detail, setDetail] = useState<DetailPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("orderId");
    router.replace(`/admin-panel/orders${next.size ? `?${next.toString()}` : ""}`);
  }, [router, searchParams]);

  useEffect(() => {
    if (!orderId) {
      setDetail(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/admin/orders?orderId=${encodeURIComponent(orderId)}`, {
      credentials: "same-origin",
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("not_found");
        return (await response.json()) as DetailPayload;
      })
      .then((data) => {
        if (cancelled) return;
        setDetail(data);
      })
      .catch(() => {
        if (cancelled) return;
        setError("주문 정보를 불러올 수 없습니다.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [orderId, close]);

  if (!orderId) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] grid place-items-center bg-black/65 backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="w-[min(640px,94vw)] max-h-[88vh] overflow-hidden rounded-3xl border border-cream/15 bg-[#1A1916] text-cream shadow-[0_24px_80px_rgba(0,0,0,.55)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-cream/10 px-5 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#D97757]">ORDER DETAIL</p>
            <h2 className="mt-0.5 text-sm font-bold">주문 상세 내역</h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-full border border-cream/15 px-3 py-1 text-xs text-cream/70 transition hover:border-cream/40 hover:text-cream"
            aria-label="닫기"
          >
            닫기
          </button>
        </header>

        <div className="max-h-[calc(88vh-64px)] overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="py-12 text-center font-mono text-xs text-cream/50">불러오는 중...</p>
          ) : error ? (
            <p className="py-12 text-center text-xs text-[#F0E2D2]">{error}</p>
          ) : detail ? (
            <div className="grid gap-5 text-xs">
              <section className="rounded-2xl border border-cream/10 bg-[#15140F]/70 p-4">
                <dl className="grid gap-2">
                  <Row label="주문번호" value={<span className="font-mono">{detail.order.order_no}</span>} />
                  <Row label="상품" value={detail.order.product_code || "—"} />
                  <Row label="구분" value={detail.order.product_kind || "—"} />
                  <Row label="결제 금액" value={<span className="font-mono">₩{(detail.order.amount || 0).toLocaleString("ko-KR")}</span>} />
                  <Row label="구매자" value={detail.order.buyer_name || "—"} />
                  <Row label="이메일" value={<span className="font-mono">{detail.order.user_email || detail.order.contact_email || "—"}</span>} />
                  <Row label="연락처" value={<span className="font-mono">{formatPhone(detail.order.buyer_phone)}</span>} />
                  <Row label="결제수단" value={detail.order.pay_method || "—"} />
                  <Row label="PG mul_no" value={<span className="font-mono">{detail.order.payapp_mul_no || "—"}</span>} />
                  <Row label="상태" value={<StatusBadge status={detail.order.status} />} />
                  <Row label="결제시각" value={detail.order.paid_at ? new Date(detail.order.paid_at).toLocaleString("ko-KR") : "—"} />
                  <Row label="신청시각" value={new Date(detail.order.created_at).toLocaleString("ko-KR")} />
                </dl>
              </section>

              <section>
                <h3 className="mb-2 text-xs font-bold text-cream/80">발급된 API 키</h3>
                {detail.issuedKeys.length === 0 ? (
                  <p className="rounded-xl border border-cream/10 bg-[#15140F]/40 px-4 py-3 text-[11px] text-cream/40">
                    발급된 키가 없습니다.
                  </p>
                ) : (
                  <ul className="grid gap-2">
                    {detail.issuedKeys.map((key) => (
                      <li
                        key={key.id}
                        className="flex items-center justify-between rounded-xl border border-cream/10 bg-[#15140F]/40 px-3 py-2 font-mono text-[11px]"
                      >
                        <span>
                          sk-{(key.fp16 || "????").slice(0, 4)}***...{key.last4 || "????"}
                          <span className="ml-2 text-[10px] text-cream/40">
                            initial ${key.initial_balance ?? "—"}
                          </span>
                        </span>
                        <span className="text-[10px] text-cream/40">
                          {key.issued_at ? new Date(key.issued_at).toLocaleDateString("ko-KR") : "—"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-xs font-bold text-cream/80">알림톡 발송 이력</h3>
                {detail.alimtalkLogs.length === 0 ? (
                  <p className="rounded-xl border border-cream/10 bg-[#15140F]/40 px-4 py-3 text-[11px] text-cream/40">
                    발송 이력이 없습니다.
                  </p>
                ) : (
                  <ul className="grid gap-2">
                    {detail.alimtalkLogs.map((log) => (
                      <li
                        key={log.id}
                        className="flex items-start justify-between rounded-xl border border-cream/10 bg-[#15140F]/40 px-3 py-2 text-[11px]"
                      >
                        <div>
                          <div className="font-bold text-cream/85">
                            {log.template_code}
                            <span className="ml-2 text-[10px] font-normal text-cream/40">
                              ({log.recipient === "buyer" ? "구매자" : "운영자"})
                            </span>
                          </div>
                          <div className="font-mono text-[10px] text-cream/50">{log.phone}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            <AlimtalkResendButton
                              logId={log.id}
                              templateCode={log.template_code}
                              phone={log.phone}
                            />
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                log.result === "success"
                                  ? "bg-emerald-500/15 text-emerald-300"
                                  : "bg-[#D97757]/15 text-[#F0E2D2]"
                              }`}
                            >
                              {log.result === "success" ? "성공" : "실패"}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-cream/40">
                            {new Date(log.sent_at).toLocaleTimeString("ko-KR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-2xl border border-[#D97757]/25 bg-[#D97757]/5 p-4">
                <h3 className="mb-2 text-xs font-bold text-[#F0E2D2]">관리 액션</h3>
                <p className="mb-3 text-[10px] text-cream/50">
                  실행되면 감사 로그(admin_audit_logs)에 기록됩니다. PG 환불은 PayApp에서 별도 실행 후 부기 기록용으로만 사용하세요.
                </p>
                <AdminOrderStatusActions
                  orderId={detail.order.id}
                  orderNo={detail.order.order_no}
                  currentStatus={detail.order.status}
                  onDone={close}
                />
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[10px] uppercase tracking-[0.16em] text-cream/40">{label}</dt>
      <dd className="text-[11px] text-cream/85">{value}</dd>
    </div>
  );
}
