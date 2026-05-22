"use client";

import React, { useState, useEffect } from "react";

interface BundleProduct {
  id: string;
  product_code: string;
  display_name: string;
  ai_partner: "gemini" | "gpt" | "perplexity";
  description: string;
  period_months: number | null;
  included_balance: number | null;
  price_krw: number | null;
  original_price_krw: number | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
}

export default function BundleProductManager() {
  const [products, setProducts] = useState<BundleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // 편집/추가 폼 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null); // null 이면 신규 등록

  // 폼 필드 상태
  const [productCode, setProductCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [aiPartner, setAiPartner] = useState<"gemini" | "gpt" | "perplexity">("gemini");
  const [description, setDescription] = useState("");
  const [periodMonths, setPeriodMonths] = useState<string>("");
  const [includedBalance, setIncludedBalance] = useState<string>("");
  const [priceKrw, setPriceKrw] = useState<string>("");
  const [originalPriceKrw, setOriginalPriceKrw] = useState<string>("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState<number>(0);

  const fetchProducts = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/bundle-products");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "번들 리스트 조회 실패");
      }
      setProducts(data.data || []);
    } catch (err: any) {
      setErrorMsg(err.message || "네트워크 에러");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const resetForm = () => {
    setEditId(null);
    setProductCode("");
    setDisplayName("");
    setAiPartner("gemini");
    setDescription("");
    setPeriodMonths("");
    setIncludedBalance("");
    setPriceKrw("");
    setOriginalPriceKrw("");
    setIsFeatured(false);
    setIsActive(true);
    setSortOrder(0);
    setIsEditing(false);
  };

  const handleEditOpen = (product: BundleProduct) => {
    setEditId(product.id);
    setProductCode(product.product_code);
    setDisplayName(product.display_name);
    setAiPartner(product.ai_partner);
    setDescription(product.description || "");
    setPeriodMonths(product.period_months !== null ? String(product.period_months) : "");
    setIncludedBalance(product.included_balance !== null ? String(product.included_balance) : "");
    setPriceKrw(product.price_krw !== null ? String(product.price_krw) : "");
    setOriginalPriceKrw(product.original_price_krw !== null ? String(product.original_price_krw) : "");
    setIsFeatured(product.is_featured);
    setIsActive(product.is_active);
    setSortOrder(product.sort_order);
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!productCode || !displayName) {
      setErrorMsg("상품코드와 표시명은 필수입니다.");
      return;
    }

    const payload = {
      id: editId,
      product_code: productCode,
      display_name: displayName,
      ai_partner: aiPartner,
      description,
      period_months: periodMonths === "" ? null : Number(periodMonths),
      included_balance: includedBalance === "" ? null : Number(includedBalance),
      price_krw: priceKrw === "" ? null : Number(priceKrw),
      original_price_krw: originalPriceKrw === "" ? null : Number(originalPriceKrw),
      is_featured: isFeatured,
      is_active: isActive,
      sort_order: sortOrder,
    };

    try {
      const url = "/api/admin/bundle-products";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "저장 실패");
      }

      resetForm();
      fetchProducts();
    } catch (err: any) {
      setErrorMsg(err.message || "저장 오류");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 이 번들 상품을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch("/api/admin/bundle-products", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "삭제 실패");
      }
      fetchProducts();
    } catch (err: any) {
      alert(err.message || "삭제 오류");
    }
  };

  return (
    <div className="bg-white border border-[rgba(15,14,13,0.08)] rounded-[20px] p-6 shadow-sm font-sans">
      <div className="flex justify-between items-center mb-6 border-b border-[rgba(15,14,13,0.06)] pb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--surface-dark)]">AI플랜 구독 패키지 관리 (bundle_products)</h3>
          <p className="text-xs text-[var(--cream-soft)] mt-1">판매 페이지에 노출될 패키지 상품 CRUD</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-[var(--coral)] hover:bg-[var(--coral-soft)] text-white text-xs font-bold rounded-[10px] shadow-sm transition-all duration-200"
          >
            + 새 패키지 추가
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="mb-4 text-xs text-[rgba(229,148,120,0.9)] bg-[rgba(229,148,120,0.05)] border border-[rgba(229,148,120,0.15)] rounded-[8px] p-3 leading-relaxed">
          {errorMsg}
        </div>
      )}

      {/* 입력 / 편집 폼 */}
      {isEditing && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-cream/30 border border-[rgba(15,14,13,0.05)] rounded-[16px] space-y-4">
          <h4 className="text-sm font-bold text-[var(--surface-dark)]">{editId ? "패키지 수정" : "신규 패키지 등록"}</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--surface-dark)] mb-1">상품 코드 (예: BUNDLE_GEMINI)</label>
              <input
                type="text"
                required
                placeholder="BUNDLE_*"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                className="w-full bg-white border border-[rgba(15,14,13,0.1)] rounded-[10px] px-3 py-2 text-xs text-[var(--surface-dark)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--surface-dark)] mb-1">표시용 이름</label>
              <input
                type="text"
                required
                placeholder="클코클라우드 × Gemini"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-white border border-[rgba(15,14,13,0.1)] rounded-[10px] px-3 py-2 text-xs text-[var(--surface-dark)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--surface-dark)] mb-1">AI 파트너</label>
              <select
                value={aiPartner}
                onChange={(e) => setAiPartner(e.target.value as any)}
                className="w-full bg-white border border-[rgba(15,14,13,0.1)] rounded-[10px] px-3 py-2 text-xs text-[var(--surface-dark)]"
              >
                <option value="gemini">Gemini (Google)</option>
                <option value="gpt">GPT (OpenAI)</option>
                <option value="perplexity">Perplexity</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--surface-dark)] mb-1">설명 (비워둘 시 기본문구)</label>
            <input
              type="text"
              placeholder="패키지에 대한 한 줄 요약을 적어주세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-[rgba(15,14,13,0.1)] rounded-[10px] px-3 py-2 text-xs text-[var(--surface-dark)]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--surface-dark)] mb-1">기간 (개월) (공백 = 준비중)</label>
              <input
                type="number"
                placeholder="예: 3"
                value={periodMonths}
                onChange={(e) => setPeriodMonths(e.target.value)}
                className="w-full bg-white border border-[rgba(15,14,13,0.1)] rounded-[10px] px-3 py-2 text-xs text-[var(--surface-dark)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--surface-dark)] mb-1">포함 API 키 잔액 (USD)</label>
              <input
                type="number"
                placeholder="예: 500"
                value={includedBalance}
                onChange={(e) => setIncludedBalance(e.target.value)}
                className="w-full bg-white border border-[rgba(15,14,13,0.1)] rounded-[10px] px-3 py-2 text-xs text-[var(--surface-dark)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--surface-dark)] mb-1">결제 판매가 (KRW) (공백 = 준비중)</label>
              <input
                type="number"
                placeholder="예: 180000"
                value={priceKrw}
                onChange={(e) => setPriceKrw(e.target.value)}
                className="w-full bg-white border border-[rgba(15,14,13,0.1)] rounded-[10px] px-3 py-2 text-xs text-[var(--surface-dark)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--surface-dark)] mb-1">원래 정가 (KRW) (선택)</label>
              <input
                type="number"
                placeholder="예: 250000"
                value={originalPriceKrw}
                onChange={(e) => setOriginalPriceKrw(e.target.value)}
                className="w-full bg-white border border-[rgba(15,14,13,0.1)] rounded-[10px] px-3 py-2 text-xs text-[var(--surface-dark)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="flex items-center gap-2">
              <input
                id="f-isfeatured"
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded border-[rgba(15,14,13,0.2)] text-[var(--coral)] focus:ring-[var(--coral)]"
              />
              <label htmlFor="f-isfeatured" className="text-xs font-semibold text-[var(--surface-dark)]">추천 강조 패키지 (Featured)</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="f-isactive"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-[rgba(15,14,13,0.2)] text-[var(--coral)] focus:ring-[var(--coral)]"
              />
              <label htmlFor="f-isactive" className="text-xs font-semibold text-[var(--surface-dark)]">판매 노출 여부 (Active)</label>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-[var(--surface-dark)] min-w-[60px]">정렬 순서:</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-20 bg-white border border-[rgba(15,14,13,0.1)] rounded-[8px] px-2.5 py-1 text-xs text-[var(--surface-dark)]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[rgba(15,14,13,0.05)]">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-[rgba(15,14,13,0.1)] rounded-[10px] text-xs font-bold text-[var(--surface-dark)] hover:bg-cream/40"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--coral)] hover:bg-[var(--coral-soft)] text-white text-xs font-bold rounded-[10px]"
            >
              {editId ? "수정 완료" : "등록 완료"}
            </button>
          </div>
        </form>
      )}

      {/* 목록 테이블 */}
      {loading ? (
        <div className="text-center py-10 text-xs text-[var(--cream-soft)] font-mono">로딩 중...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-8 text-xs text-[var(--cream-soft)]">등록된 번들 상품이 없습니다.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-cream/40 border-b border-[rgba(15,14,13,0.06)] text-[var(--cream-soft)] font-semibold uppercase">
                <th className="p-4">코드</th>
                <th className="p-4">표시명</th>
                <th className="p-4">AI 파트너</th>
                <th className="p-4">기간 / 잔액</th>
                <th className="p-4">판매가 (정가)</th>
                <th className="p-4">추천</th>
                <th className="p-4">활성</th>
                <th className="p-4">정렬</th>
                <th className="p-4 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(15,14,13,0.04)]">
              {products.map((prod) => (
                <tr key={prod.id} className="hover:bg-cream/20">
                  <td className="p-4 font-mono font-bold text-[var(--surface-dark)]">{prod.product_code}</td>
                  <td className="p-4 font-semibold text-[var(--surface-dark)]">{prod.display_name}</td>
                  <td className="p-4 uppercase text-[var(--cream-soft)] font-mono">{prod.ai_partner}</td>
                  <td className="p-4">
                    {prod.period_months ? `${prod.period_months}개월` : "준비중"} /{" "}
                    {prod.included_balance ? `$${prod.included_balance.toLocaleString()}` : "준비중"}
                  </td>
                  <td className="p-4 font-bold text-[var(--coral)]">
                    {prod.price_krw ? `₩${prod.price_krw.toLocaleString()}원` : "준비중"}
                    {prod.original_price_krw && (
                      <span className="text-[10px] line-through text-[var(--cream-soft)] ml-1">
                        (₩{prod.original_price_krw.toLocaleString()})
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {prod.is_featured ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(229,148,120,0.1)] text-[var(--coral)] border border-[var(--coral)]/20 font-bold">YES</span>
                    ) : (
                      <span className="text-[10px] text-[var(--cream-soft)]">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    {prod.is_active ? (
                      <span className="text-[10px] text-emerald-600 font-bold">노출</span>
                    ) : (
                      <span className="text-[10px] text-gray-400">숨김</span>
                    )}
                  </td>
                  <td className="p-4 font-mono">{prod.sort_order}</td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleEditOpen(prod)}
                      className="px-2.5 py-1.5 border border-[rgba(15,14,13,0.1)] rounded-[8px] hover:bg-cream/40 text-[var(--surface-dark)] font-semibold transition"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(prod.id)}
                      className="px-2.5 py-1.5 border border-red-200 text-red-500 rounded-[8px] hover:bg-red-50 font-semibold transition"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
