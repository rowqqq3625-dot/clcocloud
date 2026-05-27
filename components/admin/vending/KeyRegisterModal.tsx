"use client";

import { useEffect, useState } from "react";
import type { Plan, BulkRegisterResult } from "@/lib/vending/types";
import { BulkUploadDropzone } from "./BulkUploadDropzone";

type Mode = "single" | "bulk" | "csv";

type Props = {
  open: boolean;
  plans: Plan[];
  defaultPlanCode?: string;
  csrfToken: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function KeyRegisterModal({ open, plans, defaultPlanCode, csrfToken, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<Mode>("single");
  const [planCode, setPlanCode] = useState(defaultPlanCode || plans[0]?.code || "");
  const [keyValue, setKeyValue] = useState("");
  const [memo, setMemo] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkRegisterResult | null>(null);

  useEffect(() => {
    if (open) {
      setMode("single");
      setPlanCode(defaultPlanCode || plans[0]?.code || "");
      setKeyValue("");
      setMemo("");
      setBulkText("");
      setError(null);
      setResult(null);
      setBusy(false);
    }
  }, [open, defaultPlanCode, plans]);

  if (!open) return null;

  const submitSingle = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/vending/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-CSRF": csrfToken },
        body: JSON.stringify({ plan_code: planCode, key_value: keyValue, memo: memo || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "등록 실패");
        return;
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || "네트워크 오류");
    } finally {
      setBusy(false);
    }
  };

  const submitBulk = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/vending/keys/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-CSRF": csrfToken },
        body: JSON.stringify({ plan_code: planCode, raw_text: bulkText, memo: memo || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "대량 등록 실패");
        return;
      }
      setResult(data as BulkRegisterResult);
      onSuccess();
    } catch (e: any) {
      setError(e.message || "네트워크 오류");
    } finally {
      setBusy(false);
    }
  };

  const submitCsv = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/admin/vending/keys/csv", {
        method: "POST",
        headers: { "X-Admin-CSRF": csrfToken },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "CSV 업로드 실패");
        return;
      }
      setResult(data as BulkRegisterResult);
      onSuccess();
    } catch (e: any) {
      setError(e.message || "네트워크 오류");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] grid place-items-center bg-black/55 backdrop-blur-sm">
      <div className="w-[min(640px,94vw)] max-h-[90vh] overflow-auto rounded-3xl border border-cream/15 bg-[#1A1916] p-6 text-cream shadow-[0_24px_80px_rgba(0,0,0,.45)]">
        <p className="text-base font-bold text-[#D97757]">API 키 등록</p>
        <p className="mt-1 text-xs text-cream/50">자판기에 키를 추가합니다. 결제 완료 시 정확히 1건씩 출고됩니다.</p>

        <div className="mt-4 flex gap-2">
          <ModeButton current={mode} value="single" onClick={() => setMode("single")}>단건</ModeButton>
          <ModeButton current={mode} value="bulk" onClick={() => setMode("bulk")}>대량 (텍스트)</ModeButton>
          <ModeButton current={mode} value="csv" onClick={() => setMode("csv")}>CSV 업로드</ModeButton>
        </div>

        <div className="mt-5 grid gap-3">
          {mode !== "csv" ? (
            <label className="grid gap-1.5 text-xs text-cream/70">
              <span>플랜</span>
              <select
                value={planCode}
                onChange={(e) => setPlanCode(e.target.value)}
                className="rounded-2xl border border-cream/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-[#D97757]"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.code}>
                    {p.code} · {p.name_ko}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {mode === "single" ? (
            <label className="grid gap-1.5 text-xs text-cream/70">
              <span>API 키 (sk-ant-...)</span>
              <input
                type="text"
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                className="rounded-2xl border border-cream/15 bg-black/40 px-4 py-2.5 font-mono text-xs outline-none focus:border-[#D97757]"
                placeholder="sk-ant-api03-XXXXXXXXXXXXXXXX"
              />
            </label>
          ) : null}

          {mode === "bulk" ? (
            <label className="grid gap-1.5 text-xs text-cream/70">
              <span>한 줄당 1키 (최대 500개)</span>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={10}
                spellCheck={false}
                className="rounded-2xl border border-cream/15 bg-black/40 px-4 py-2.5 font-mono text-[11px] outline-none focus:border-[#D97757]"
                placeholder={"sk-ant-api03-AAA...\nsk-ant-api03-BBB...\nsk-ant-api03-CCC..."}
              />
            </label>
          ) : null}

          {mode === "csv" ? (
            <BulkUploadDropzone onFile={submitCsv} busy={busy} />
          ) : null}

          {mode !== "csv" ? (
            <label className="grid gap-1.5 text-xs text-cream/70">
              <span>메모 (선택)</span>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                maxLength={500}
                className="rounded-2xl border border-cream/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-[#D97757]"
                placeholder="발급 출처, 만료 예정 등"
              />
            </label>
          ) : null}
        </div>

        {error ? (
          <p className="mt-3 rounded-2xl border border-[#D97757]/40 bg-[#D97757]/10 px-3 py-2 text-xs text-[#F0E2D2]">{error}</p>
        ) : null}

        {result ? (
          <div className="mt-3 grid gap-2 rounded-2xl border border-cream/10 bg-black/30 p-3 text-xs">
            <p className="font-mono uppercase tracking-[0.16em] text-cream/60">결과</p>
            <p className="text-cream/80">
              총 {result.total} · 등록 {result.registered} · 중복 {result.duplicates} · 실패 {result.failures.length}
            </p>
            {result.failures.length > 0 ? (
              <div className="max-h-32 overflow-auto rounded-xl bg-black/30 p-2 font-mono text-[10px] text-cream/60">
                {result.failures.slice(0, 30).map((f, i) => (
                  <div key={i}>
                    L{f.line} · {f.key_preview} · {f.reason}
                  </div>
                ))}
                {result.failures.length > 30 ? <div>...외 {result.failures.length - 30}건</div> : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-full border border-cream/15 px-4 py-2 text-xs font-bold text-cream/80 transition hover:border-cream/40 disabled:opacity-60">
            {result ? "닫기" : "취소"}
          </button>
          {mode === "single" ? (
            <button type="button" onClick={submitSingle} disabled={busy || !keyValue || !planCode} className="rounded-full bg-[#D97757] px-4 py-2 text-xs font-bold text-cream transition hover:bg-[#c5694b] disabled:opacity-60">
              등록
            </button>
          ) : null}
          {mode === "bulk" ? (
            <button type="button" onClick={submitBulk} disabled={busy || !bulkText.trim() || !planCode} className="rounded-full bg-[#D97757] px-4 py-2 text-xs font-bold text-cream transition hover:bg-[#c5694b] disabled:opacity-60">
              대량 등록
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ModeButton({ current, value, onClick, children }: { current: Mode; value: Mode; onClick: () => void; children: React.ReactNode }) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-3 py-1.5 text-xs font-bold transition",
        active ? "bg-[#D97757]/20 text-[#F0E2D2]" : "border border-cream/15 text-cream/70 hover:border-cream/40",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
