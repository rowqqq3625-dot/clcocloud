"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PricingPlan } from "@/lib/pricing";

const osOptions = ["macOS", "Windows", "Linux"] as const;
type OsTarget = (typeof osOptions)[number];
type Step = "details" | "bank" | "pending";

type CheckoutFlowProps = {
  plan: PricingPlan;
  defaultEmail?: string;
};

const bankItems = [
  { label: "입금자명", masked: "김정…", value: "김정후", helper: "이름 일부는 보호됩니다." },
  { label: "은행", masked: "케이뱅크", value: "케이뱅크", helper: "입금 은행" },
  { label: "계좌번호", masked: "100-239-••••••", value: "100-239-063680", helper: "복사하면 전체 계좌번호가 입력됩니다." }
] as const;

function formatKrw(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export function CheckoutFlow({ plan, defaultEmail = "" }: CheckoutFlowProps) {
  const [step, setStep] = useState<Step>("details");
  const [contactEmail, setContactEmail] = useState(defaultEmail);
  const [selectedOs, setSelectedOs] = useState<OsTarget[]>([]);
  const [finalAgreed, setFinalAgreed] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canContinue = useMemo(() => /.+@.+\..+/.test(contactEmail) && selectedOs.length > 0, [contactEmail, selectedOs]);

  const toggleOs = (target: OsTarget) => {
    setSelectedOs((current) => current.includes(target) ? current.filter((item) => item !== target) : [...current, target]);
  };

  const copyValue = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1800);
  };

  const submitOrder = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, contactEmail, osTargets: selectedOs })
      });
      if (!response.ok) throw new Error("order_failed");
      setStep("pending");
    } catch {
      setError("주문 저장을 완료하지 못했습니다. 잠시 후 다시 시도하세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,.92fr)_minmax(0,1.08fr)]">
      <aside className="relative overflow-hidden rounded-[32px] border border-cream/10 bg-dark p-8 text-cream shadow-[0_32px_100px_rgba(31,30,29,.20)]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-coral/30 blur-[90px]" />
        <div className="relative">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-coral-hi">Selected balance</p>
          <h2 className="mt-5 text-[clamp(42px,6vw,76px)] font-[700] leading-none tracking-[-0.06em]">${plan.balance}</h2>
          <p className="mt-4 text-2xl font-semibold text-coral-hi">₩{formatKrw(plan.price)}</p>
          <p className="mt-6 max-w-sm text-[15px] leading-7 text-cream/62">{plan.name} 플랜으로 시작합니다. 잔액은 기간 만료 없이 API 키 사용량에 따라 차감됩니다.</p>
          <div className="mt-8 grid gap-3 text-sm text-cream/72">
            {["공식 클로드코드 호환", "개인 전용 API 키", "관리자 입금 확인 후 발급"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-cream/10 bg-cream/[.06] px-4 py-3">
                <span className="h-1.5 w-1.5 rounded-full bg-coral-hi shadow-[0_0_18px_rgba(232,144,114,.75)]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </aside>

      <section className="rounded-[32px] border border-[var(--border-subtle)] bg-cream/82 p-5 shadow-[0_24px_80px_rgba(31,30,29,.10)] backdrop-blur-xl sm:p-8">
        {step === "details" ? (
          <div>
            <p className="text-sm font-semibold text-coral">구매 정보</p>
            <h1 className="mt-3 text-[clamp(34px,4vw,54px)] font-[680] leading-[1.1] tracking-[-0.035em]">입금 전 정보를 확인하세요.</h1>
            <label className="mt-8 block">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary">Email</span>
              <input
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                placeholder="api@example.com"
                type="email"
                className="mt-3 h-14 w-full rounded-2xl border border-[var(--border-subtle)] bg-white px-4 text-[15px] font-semibold outline-none transition focus:border-coral focus:shadow-[0_0_0_4px_rgba(217,119,87,.10)]"
              />
            </label>

            <div className="mt-7">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary">OS 선택</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {osOptions.map((target) => {
                  const active = selectedOs.includes(target);
                  return (
                    <button
                      key={target}
                      type="button"
                      onClick={() => toggleOs(target)}
                      className={`min-h-14 rounded-2xl border px-4 text-sm font-bold transition active:scale-[.98] ${active ? "border-coral bg-coral text-cream shadow-coral" : "border-[var(--border-subtle)] bg-white hover:border-coral/50"}`}
                    >
                      {target}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              disabled={!canContinue}
              onClick={() => setStep("bank")}
              className="mt-8 min-h-14 w-full rounded-2xl bg-coral px-5 text-base font-bold text-cream shadow-coral transition hover:-translate-y-0.5 hover:bg-coral-hi disabled:cursor-not-allowed disabled:bg-secondary/30 disabled:shadow-none"
            >
              구매하기
            </button>
          </div>
        ) : null}

        {step === "bank" ? (
          <div>
            <p className="text-sm font-semibold text-coral">계좌 정보</p>
            <h1 className="mt-3 text-[clamp(34px,4vw,54px)] font-[680] leading-[1.1] tracking-[-0.035em]">아래 계좌로 입금하세요.</h1>
            <div className="mt-7 grid gap-3">
              {bankItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border-subtle)] bg-white p-4 shadow-sm">
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary">{item.label}</p>
                    <p className="mt-2 break-all text-xl font-bold tracking-[-0.02em] text-primary">{item.masked}</p>
                    <p className="mt-1 text-xs text-secondary/70">{item.helper}</p>
                  </div>
                  <button type="button" onClick={() => copyValue(item.label, item.value)} className="shrink-0 rounded-xl border border-coral/30 bg-coral/10 px-4 py-2 text-sm font-bold text-coral transition hover:bg-coral hover:text-cream">
                    {copied === item.label ? "복사됨" : "복사"}
                  </button>
                </div>
              ))}
            </div>
            {error ? <p className="mt-4 rounded-2xl border border-coral/25 bg-coral/10 px-4 py-3 text-sm font-semibold text-coral">{error}</p> : null}
            <label className="mt-5 flex gap-2 rounded-xl border border-[var(--border-subtle)] bg-white/55 px-3 py-2.5 text-[12px] leading-5 text-secondary/80">
              <input
                type="checkbox"
                checked={finalAgreed}
                onChange={(event) => setFinalAgreed(event.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[var(--coral)]"
              />
              <span>
                본 상품의{" "}
                <Link href="/docs/terms" target="_blank" className="font-semibold text-primary/80 underline-offset-2 hover:text-coral hover:underline">
                  이용약관 및 정책
                </Link>{" "}
                전문을 모두 확인하였으며, 이에 동의합니다.
              </span>
            </label>
            <button type="button" onClick={submitOrder} disabled={submitting || !finalAgreed} className="mt-5 min-h-14 w-full rounded-2xl bg-primary px-5 text-base font-bold text-cream shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-secondary/30 disabled:opacity-60 disabled:shadow-none">
              {submitting ? "저장 중" : "결제완료"}
            </button>
          </div>
        ) : null}

        {step === "pending" ? (
          <div className="grid min-h-[460px] place-items-center text-center">
            <div>
              <p className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-coral text-2xl font-bold text-cream shadow-coral">✓</p>
              <h1 className="mt-7 text-[clamp(34px,4vw,54px)] font-[680] leading-[1.1] tracking-[-0.035em]">결제 확인중입니다.</h1>
              <p className="mx-auto mt-5 max-w-md text-[16px] leading-7 text-secondary">관리자가 입금을 확인한 뒤 API 키를 발급중입니다. 입력하신 이메일로 안내가 전달됩니다.</p>
              <a href="/dashboard" className="mt-8 inline-flex min-h-12 items-center rounded-2xl border border-[var(--border-subtle)] bg-white px-5 text-sm font-bold text-primary transition hover:border-coral/50 hover:text-coral">대시보드로 이동</a>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
