"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { adminCsrfHeaders } from "@/lib/admin-csrf-client";

export type BundleProduct = {
  id: string;
  product_code: string;
  display_name: string;
  ai_partner: string | null;
  description: string | null;
  period_months: number | null;
  included_balance: number | null;
  price_krw: number | null;
  original_price_krw: number | null;
  is_featured: boolean | null;
  is_active: boolean | null;
  sort_order: number | null;
};

type FormState = {
  id: string | null;
  product_code: string;
  display_name: string;
  ai_partner: string;
  description: string;
  period_months: string;
  included_balance: string;
  price_krw: string;
  original_price_krw: string;
  is_featured: boolean;
  is_active: boolean;
  sort_order: string;
};

const EMPTY_FORM: FormState = {
  id: null,
  product_code: "",
  display_name: "",
  ai_partner: "gemini",
  description: "",
  period_months: "",
  included_balance: "",
  price_krw: "",
  original_price_krw: "",
  is_featured: false,
  is_active: true,
  sort_order: "0",
};

function fmtKrw(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return `₩${value.toLocaleString("ko-KR")}`;
}

export function BundleProductsManager({ initial }: { initial: BundleProduct[] }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BundleProduct | null>(null);

  const startCreate = () => {
    setForm(EMPTY_FORM);
    setFormOpen(true);
    setError(null);
    setStatus(null);
  };

  const startEdit = (row: BundleProduct) => {
    setForm({
      id: row.id,
      product_code: row.product_code || "",
      display_name: row.display_name || "",
      ai_partner: row.ai_partner || "gemini",
      description: row.description || "",
      period_months: row.period_months == null ? "" : String(row.period_months),
      included_balance: row.included_balance == null ? "" : String(row.included_balance),
      price_krw: row.price_krw == null ? "" : String(row.price_krw),
      original_price_krw: row.original_price_krw == null ? "" : String(row.original_price_krw),
      is_featured: Boolean(row.is_featured),
      is_active: row.is_active !== false,
      sort_order: row.sort_order == null ? "0" : String(row.sort_order),
    });
    setFormOpen(true);
    setError(null);
    setStatus(null);
  };

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setStatus(null);
    const isEdit = form.id !== null;
    try {
      const payload = {
        id: form.id || undefined,
        product_code: form.product_code,
        display_name: form.display_name,
        ai_partner: form.ai_partner,
        description: form.description || null,
        period_months: form.period_months,
        included_balance: form.included_balance,
        price_krw: form.price_krw,
        original_price_krw: form.original_price_krw,
        is_featured: form.is_featured,
        is_active: form.is_active,
        sort_order: form.sort_order,
      };
      const response = await fetch("/api/admin/bundle-products", {
        method: isEdit ? "PUT" : "POST",
        credentials: "same-origin",
        headers: adminCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        setError("저장에 실패했습니다. 입력값을 확인해 주세요.");
        return;
      }
      setStatus(isEdit ? "수정되었습니다." : "등록되었습니다.");
      setFormOpen(false);
      setForm(EMPTY_FORM);
      router.refresh();
    } catch {
      setError("네트워크 오류");
    } finally {
      setBusy(false);
    }
  };

  const performDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const response = await fetch("/api/admin/bundle-products", {
        method: "DELETE",
        credentials: "same-origin",
        headers: adminCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      if (!response.ok) {
        setError("삭제에 실패했습니다.");
        return;
      }
      setStatus(`${deleteTarget.product_code} 삭제 완료`);
      router.refresh();
    } catch {
      setError("네트워크 오류");
    } finally {
      setBusy(false);
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] text-cream/40">
          * 모든 CRUD는 감사 로그에 기록됩니다. price/balance/period는 비워두면 NULL.
        </p>
        <button
          type="button"
          onClick={startCreate}
          className="rounded-full bg-[#D97757] px-4 py-1.5 text-xs font-bold text-cream transition hover:bg-[#c5694b]"
        >
          + 신규 번들 추가
        </button>
      </div>

      {status ? (
        <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-200">
          {status}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-[#D97757]/30 bg-[#D97757]/10 px-3 py-2 text-[11px] text-[#F0E2D2]">
          {error}
        </p>
      ) : null}

      {formOpen ? (
        <form
          onSubmit={submitForm}
          className="grid gap-3 rounded-2xl border border-cream/15 bg-[#1F1E1D]/80 p-5"
        >
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-cream/85">
              {form.id ? `편집: ${form.product_code}` : "신규 번들"}
            </h3>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="text-xs text-cream/50 hover:text-cream/80"
            >
              취소
            </button>
          </header>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="product_code (대문자)" required>
              <input
                value={form.product_code}
                onChange={(e) => setForm({ ...form, product_code: e.target.value.toUpperCase() })}
                disabled={busy || form.id !== null}
                required
                className={inputCls}
                placeholder="STANDARD"
              />
            </Field>
            <Field label="표시명" required>
              <input
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                disabled={busy}
                required
                className={inputCls}
                placeholder="Standard 1개월"
              />
            </Field>
            <Field label="AI 파트너">
              <select
                value={form.ai_partner}
                onChange={(e) => setForm({ ...form, ai_partner: e.target.value })}
                disabled={busy}
                className={inputCls}
              >
                <option value="gemini">gemini</option>
                <option value="gpt">gpt</option>
                <option value="perplexity">perplexity</option>
              </select>
            </Field>
            <Field label="period_months">
              <input
                type="number"
                value={form.period_months}
                onChange={(e) => setForm({ ...form, period_months: e.target.value })}
                disabled={busy}
                className={inputCls}
                placeholder="1"
              />
            </Field>
            <Field label="included_balance (USD)">
              <input
                type="number"
                value={form.included_balance}
                onChange={(e) => setForm({ ...form, included_balance: e.target.value })}
                disabled={busy}
                className={inputCls}
                placeholder="200"
              />
            </Field>
            <Field label="price_krw">
              <input
                type="number"
                value={form.price_krw}
                onChange={(e) => setForm({ ...form, price_krw: e.target.value })}
                disabled={busy}
                className={inputCls}
                placeholder="290000"
              />
            </Field>
            <Field label="original_price_krw (할인 전)">
              <input
                type="number"
                value={form.original_price_krw}
                onChange={(e) => setForm({ ...form, original_price_krw: e.target.value })}
                disabled={busy}
                className={inputCls}
              />
            </Field>
            <Field label="sort_order">
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                disabled={busy}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="설명">
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              disabled={busy}
              className={inputCls}
              placeholder="단기 체험용 / 가성비 / 등"
            />
          </Field>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-cream/80">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                disabled={busy}
                className="h-3.5 w-3.5 accent-[#D97757]"
              />
              활성 (is_active)
            </label>
            <label className="flex items-center gap-2 text-xs text-cream/80">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                disabled={busy}
                className="h-3.5 w-3.5 accent-[#D97757]"
              />
              추천 (is_featured)
            </label>
            <button
              type="submit"
              disabled={busy}
              className="ml-auto rounded-full bg-[#D97757] px-5 py-2 text-xs font-bold text-cream transition hover:bg-[#c5694b] disabled:opacity-60"
            >
              {busy ? "저장 중..." : form.id ? "수정 저장" : "등록"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-cream/10 bg-[#1F1E1D]/70">
        <table className="w-full table-fixed text-left text-xs">
          <thead className="bg-[#15140F] text-[10px] uppercase tracking-[0.16em] text-cream/40">
            <tr>
              <th className="w-[6%] px-3 py-2 font-mono">정렬</th>
              <th className="w-[16%] px-3 py-2 font-mono">코드</th>
              <th className="w-[22%] px-3 py-2 font-mono">표시명</th>
              <th className="w-[10%] px-3 py-2 font-mono">파트너</th>
              <th className="w-[8%] px-3 py-2 font-mono text-right">기간(월)</th>
              <th className="w-[10%] px-3 py-2 font-mono text-right">잔액</th>
              <th className="w-[12%] px-3 py-2 font-mono text-right">가격</th>
              <th className="w-[8%] px-3 py-2 font-mono">상태</th>
              <th className="w-[8%] px-3 py-2 font-mono">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream/5 text-cream/85">
            {initial.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-cream/40">
                  등록된 번들 상품이 없습니다.
                </td>
              </tr>
            ) : (
              initial.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-2 font-mono text-[10px] text-cream/60">{row.sort_order ?? 0}</td>
                  <td className="px-3 py-2 font-mono text-[11px]">{row.product_code}</td>
                  <td className="px-3 py-2 truncate">{row.display_name}</td>
                  <td className="px-3 py-2 font-mono text-[10px] text-cream/70">{row.ai_partner || "—"}</td>
                  <td className="px-3 py-2 font-mono tabular-nums text-right">{row.period_months ?? "—"}</td>
                  <td className="px-3 py-2 font-mono tabular-nums text-right">
                    {row.included_balance ? `$${row.included_balance}` : "—"}
                  </td>
                  <td className="px-3 py-2 font-mono tabular-nums text-right">{fmtKrw(row.price_krw)}</td>
                  <td className="px-3 py-2">
                    {row.is_active ? (
                      <span className="inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-emerald-300">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-cream/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-cream/50">
                        INACTIVE
                      </span>
                    )}
                    {row.is_featured ? (
                      <span className="ml-1 inline-flex rounded-full bg-[#D97757]/15 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-[#F0E2D2]">
                        ★
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(row)}
                        disabled={busy}
                        className="rounded-full border border-cream/15 px-2.5 py-1 text-[10px] font-bold text-cream/80 transition hover:border-cream/40 disabled:opacity-50"
                      >
                        편집
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(row)}
                        disabled={busy}
                        className="rounded-full border border-[#D97757]/40 px-2.5 py-1 text-[10px] font-bold text-[#F0E2D2] transition hover:border-[#D97757] disabled:opacity-50"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminConfirmDialog
        open={deleteTarget !== null}
        title="번들 상품 삭제"
        message={
          deleteTarget
            ? `${deleteTarget.product_code} / ${deleteTarget.display_name} 을(를) 삭제합니다. 이미 진행된 주문 이력은 유지되지만, 이후 신규 주문에서는 노출되지 않습니다.`
            : ""
        }
        confirmPhrase="DELETE"
        onConfirm={performDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}

const inputCls =
  "rounded-2xl border border-cream/15 bg-black/40 px-3 py-2 text-sm text-cream outline-none focus:border-[#D97757] disabled:opacity-60";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-xs text-cream/65">
      <span>
        {label}
        {required ? <span className="ml-1 text-[#D97757]">*</span> : null}
      </span>
      {children}
    </label>
  );
}
