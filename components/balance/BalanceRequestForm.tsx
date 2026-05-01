"use client";

import { useState } from "react";

export function BalanceRequestForm() {
  const [open, setOpen] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [requestAmount, setRequestAmount] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  const submit = async () => {
    setStatus("submitting");
    const response = await fetch("/api/balance-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactEmail, requestAmount, message })
    });
    if (response.status === 401) {
      window.location.href = `/start?returnTo=${encodeURIComponent("/#pricing")}`;
      return;
    }
    if (!response.ok) {
      setStatus("error");
      return;
    }
    setStatus("done");
    setContactEmail("");
    setRequestAmount("");
    setMessage("");
  };

  return (
    <div className="mt-8 rounded-[28px] border border-cream/10 bg-cream/[.06] p-5 text-cream shadow-[inset_0_1px_rgba(255,255,255,.08)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-cream">더 많은 사용량 또는 잔액충전이 필요하신가요?</p>
          <p className="mt-1 text-sm leading-6 text-cream/52">문의하면 관리자 콘솔에서 확인 후 답변합니다.</p>
        </div>
        <button type="button" onClick={() => setOpen((current) => !current)} className="rounded-2xl bg-coral px-5 py-3 text-sm font-bold text-cream shadow-coral transition hover:-translate-y-0.5 hover:bg-coral-hi">
          잔액충전 문의
        </button>
      </div>

      {open ? (
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr]">
          <input value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} placeholder="이메일" className="h-12 rounded-2xl border border-cream/10 bg-cream px-4 text-sm font-semibold text-primary outline-none focus:border-coral" />
          <input value={requestAmount} onChange={(event) => setRequestAmount(event.target.value)} placeholder="요청 금액 또는 사용량" className="h-12 rounded-2xl border border-cream/10 bg-cream px-4 text-sm font-semibold text-primary outline-none focus:border-coral" />
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="필요한 내용을 적어주세요." className="min-h-24 resize-none rounded-2xl border border-cream/10 bg-cream px-4 py-3 text-sm font-semibold leading-6 text-primary outline-none focus:border-coral md:col-span-2" />
          {status === "done" ? <p className="text-sm font-bold text-coral-hi md:col-span-2">문의가 접수되었습니다.</p> : null}
          {status === "error" ? <p className="text-sm font-bold text-coral-hi md:col-span-2">문의 저장에 실패했습니다. 입력값을 확인해주세요.</p> : null}
          <button type="button" onClick={submit} disabled={status === "submitting"} className="min-h-12 rounded-2xl border border-coral/30 bg-coral/15 px-5 text-sm font-bold text-coral-hi transition hover:bg-coral hover:text-cream disabled:opacity-60 md:col-span-2">
            {status === "submitting" ? "접수 중" : "문의 보내기"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
