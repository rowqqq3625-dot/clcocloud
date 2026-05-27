"use client";

import { useState } from "react";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import type { EligibleOrder } from "@/lib/reviews/types";

type EligibleOrderPickerProps = {
  orders: EligibleOrder[];
  initialOrderId?: string | null;
  defaultName: string;
  config: {
    eligibility_after_days: number;
    body_min_len: number;
    body_max_len: number;
    reward_usd: number;
    reward_krw: number;
  };
};

function formatKoreanDate(iso: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(d);
}

function blockerLabel(o: EligibleOrder): string {
  if (o.has_review) return "이미 작성된 주문";
  if (!o.key_issued) return "API 키 발급 대기";
  if (o.cooldown_until)
    return `리뷰 작성 가능일: ${formatKoreanDate(o.cooldown_until)}`;
  return "";
}

/**
 * Two-pane composer:
 *   1) Order picker on the left (vertical list of paid orders with
 *      eligibility status). Disabled rows show why they're blocked.
 *   2) ReviewForm on the right, bound to the selected order.
 *
 * If `initialOrderId` is supplied via the URL (?orderId=…) and that
 * order is eligible, it auto-selects. If it's blocked, the form is
 * hidden and we render the block reason inline so the user knows why.
 */
export function EligibleOrderPicker({
  orders,
  initialOrderId,
  defaultName,
  config,
}: EligibleOrderPickerProps) {
  const eligible = orders.filter((o) => o.is_eligible);
  const blocked = orders.filter((o) => !o.is_eligible);

  const initial =
    (initialOrderId && eligible.find((o) => o.id === initialOrderId)?.id) ||
    eligible[0]?.id ||
    null;
  const [selected, setSelected] = useState<string | null>(initial);

  const initialBlocked = initialOrderId
    ? blocked.find((o) => o.id === initialOrderId) || null
    : null;

  if (orders.length === 0) {
    return (
      <section className="rounded-[34px] border border-[var(--border-subtle)] bg-cream/90 p-10 text-center shadow-[0_24px_80px_rgba(31,30,29,.10)]">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-coral/80">
          Review
        </p>
        <h1 className="mt-5 text-[clamp(32px,4.5vw,52px)] font-[680] leading-[1.06] tracking-[-0.045em]">
          작성 가능한 주문이 없습니다.
        </h1>
        <p className="mx-auto mt-6 max-w-md break-keep text-[15px] leading-7 text-secondary">
          결제 + 키 발급 + {config.eligibility_after_days}일 경과 조건을 충족한 주문이 있으면 이곳에서 리뷰를 작성하고 ${config.reward_usd} 보상을 받을 수 있습니다.
        </p>
        <a
          href="/#pricing"
          className="mt-8 inline-flex min-h-12 items-center rounded-2xl bg-coral px-5 text-sm font-bold text-cream shadow-coral transition hover:-translate-y-0.5 hover:bg-coral-hi"
        >
          요금제 보기
        </a>
      </section>
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,.42fr)_minmax(0,.58fr)]">
      <aside className="rounded-[28px] border border-[var(--border-subtle)] bg-cream/85 p-5 shadow-[0_18px_60px_rgba(31,30,29,.08)]">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-coral/80">
          작성 가능한 주문
        </p>
        <h2 className="mt-2 text-2xl font-[680] tracking-[-0.025em]">
          {eligible.length}건 / 전체 {orders.length}건
        </h2>

        {eligible.length > 0 ? (
          <ul className="mt-5 grid gap-2">
            {eligible.map((o) => {
              const active = selected === o.id;
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(o.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      active
                        ? "border-coral bg-coral/10 shadow-[0_0_0_2px_rgba(217,119,87,.18)]"
                        : "border-[var(--border-subtle)] bg-white/70 hover:border-coral/40"
                    }`}
                  >
                    <p className="font-mono text-xs font-bold text-coral">{o.product_code}</p>
                    <p className="mt-1 truncate text-sm font-semibold">
                      {o.order_no}
                    </p>
                    <p className="mt-1 text-xs text-secondary">
                      결제 · {formatKoreanDate(o.paid_at)}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-[var(--border-subtle)] px-4 py-6 text-center text-xs text-secondary">
            아직 작성 가능한 주문이 없어요.
          </p>
        )}

        {blocked.length > 0 ? (
          <>
            <p className="mt-7 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-secondary/70">
              아직 작성 불가
            </p>
            <ul className="mt-3 grid gap-2">
              {blocked.map((o) => (
                <li
                  key={o.id}
                  className="rounded-2xl border border-[var(--border-subtle)] bg-cream-2/40 px-4 py-3 opacity-80"
                >
                  <p className="font-mono text-xs font-bold text-secondary/80">{o.product_code}</p>
                  <p className="mt-1 truncate text-sm font-semibold text-secondary">{o.order_no}</p>
                  <p className="mt-1 text-xs text-coral/80">{blockerLabel(o)}</p>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </aside>

      <div>
        {initialBlocked ? (
          <section className="rounded-[28px] border border-coral/30 bg-coral/10 p-8 text-center">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-coral">
              작성 불가
            </p>
            <h2 className="mt-4 text-2xl font-[680] tracking-[-0.02em]">
              {blockerLabel(initialBlocked)}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-secondary">
              아래 사이드바에서 다른 주문을 선택하거나 마이페이지에서 상태를 확인할 수 있습니다.
            </p>
          </section>
        ) : null}

        {selected ? (
          <ReviewForm
            key={selected}
            orderId={selected}
            defaultName={defaultName}
            config={config}
          />
        ) : !initialBlocked ? (
          <section className="rounded-[28px] border border-dashed border-[var(--border-subtle)] bg-cream/60 px-6 py-16 text-center">
            <p className="text-sm font-semibold text-secondary">
              왼쪽 목록에서 리뷰를 작성할 주문을 선택하세요.
            </p>
          </section>
        ) : null}
      </div>
    </section>
  );
}
