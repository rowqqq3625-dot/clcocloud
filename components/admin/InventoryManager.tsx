"use client";

import React, { useState } from "react";
import { adminCsrfHeaders } from "@/lib/admin-csrf-client";

interface InventoryManagerProps {
  onSuccess: () => void;
}

export default function InventoryManager({ onSuccess }: InventoryManagerProps) {
  const [productCode, setProductCode] = useState("STANDARD");
  const [initialBalance, setInitialBalance] = useState(200);
  const [rawKeysText, setRawKeysText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setProductCode(code);
    if (code === "STANDARD") setInitialBalance(200);
    else if (code === "PRO") setInitialBalance(500);
    else if (code === "ULTRA") setInitialBalance(1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg("");
    setErrorMsg("");

    // 줄바꿈 또는 쉼표(CSV) 기준으로 파싱
    const keys = rawKeysText
      .split(/[\n,]+/)
      .map((k) => k.trim())
      .filter((k) => k.startsWith("sk-")); // anthropic key 포맷 확인용 (가볍게 필터)

    if (keys.length === 0) {
      setErrorMsg("유효한 API 키가 입력되지 않았습니다. 'sk-'로 시작하는 키를 입력해 주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/inventory", {
        method: "POST",
        credentials: "same-origin",
        headers: adminCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          keys,
          productCode,
          initialBalance,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "키 등록 중 오류가 발생했습니다.");
      }

      setStatusMsg(
        `성공적으로 ${data.insertedCount}개의 API 키를 등록했습니다.${
          data.duplicates.length > 0 ? ` (중복 제외된 키: ${data.duplicates.length}개)` : ""
        }`
      );
      
      // 입력창 리셋 및 rawKey 즉시 소거
      setRawKeysText("");
      
      // 인벤토리 목록 갱신
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "서버 통신 실패");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-[rgba(15,14,13,0.08)] rounded-[20px] p-6 md:p-8 shadow-sm font-sans">
      <div className="mb-6">
        <span className="text-[10px] font-mono tracking-widest text-[var(--coral)] uppercase block mb-0.5">· ADD API KEYS</span>
        <h3 className="text-lg font-bold text-[var(--surface-dark)]">신규 API 키 풀 등록</h3>
        <p className="text-xs text-[var(--cream-soft)] mt-1.5 leading-relaxed">
          한 줄에 하나씩 Anthropic API 키를 입력해 주세요. (쉼표 구분도 지원) <br />
          입력한 키는 AES-256-GCM으로 안전하게 암호화되어 DB에 저장되며, 평문은 저장되지 않습니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="inv-product-code" className="block text-xs font-semibold text-[var(--surface-dark)] mb-1.5">상품 구분</label>
            <select
              id="inv-product-code"
              value={productCode}
              onChange={handleProductChange}
              disabled={isLoading}
              className="w-full bg-cream border border-[rgba(15,14,13,0.1)] rounded-[12px] px-4 py-3 text-sm text-[var(--surface-dark)] focus:outline-none focus:border-[var(--coral)] focus:ring-1 focus:ring-[var(--coral)] transition-all duration-200"
            >
              <option value="STANDARD">스탠다드 ($200)</option>
              <option value="PRO">프로 ($500)</option>
              <option value="ULTRA">울트라 ($1,000)</option>
            </select>
          </div>
          <div>
            <label htmlFor="inv-initial-balance" className="block text-xs font-semibold text-[var(--surface-dark)] mb-1.5">설정 잔액 (USD)</label>
            <input
              id="inv-initial-balance"
              type="number"
              required
              disabled={isLoading}
              value={initialBalance}
              onChange={(e) => setInitialBalance(Number(e.target.value))}
              className="w-full bg-cream border border-[rgba(15,14,13,0.1)] rounded-[12px] px-4 py-3 text-sm text-[var(--surface-dark)] focus:outline-none focus:border-[var(--coral)] focus:ring-1 focus:ring-[var(--coral)] transition-all duration-200"
            />
          </div>
        </div>

        <div>
          <label htmlFor="inv-raw-keys" className="block text-xs font-semibold text-[var(--surface-dark)] mb-1.5">API 키 목록 (Multi-line / CSV)</label>
          <textarea
            id="inv-raw-keys"
            required
            disabled={isLoading}
            rows={5}
            placeholder={`sk-ant-api03-...\nsk-ant-api03-...`}
            value={rawKeysText}
            onChange={(e) => setRawKeysText(e.target.value)}
            className="w-full bg-cream border border-[rgba(15,14,13,0.1)] rounded-[12px] px-4 py-3 text-sm font-mono text-[var(--surface-dark)] placeholder-[var(--cream-soft)]/30 focus:outline-none focus:border-[var(--coral)] focus:ring-1 focus:ring-[var(--coral)] transition-all duration-200 resize-y"
          />
        </div>

        {statusMsg && (
          <div className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-[8px] p-3 leading-relaxed">
            {statusMsg}
          </div>
        )}

        {errorMsg && (
          <div className="text-xs text-[rgba(229,148,120,0.9)] bg-[rgba(229,148,120,0.05)] border border-[rgba(229,148,120,0.15)] rounded-[8px] p-3 leading-relaxed">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 rounded-[12px] font-bold text-center text-sm text-white bg-[var(--coral)] hover:bg-[var(--coral-soft)] active:bg-[var(--coral-deep)] transition-all duration-300 disabled:opacity-50"
        >
          {isLoading ? "키를 암호화하여 등록 중..." : "인벤토리에 키 일괄 등록하기"}
        </button>
      </form>
    </div>
  );
}
