"use client";

import React, { useState, useEffect } from "react";
import AgreementCheckbox from "./AgreementCheckbox";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  productKind: "balance" | "bundle";
  productCode: string;
  price: number;
  productName: string;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  productKind,
  productCode,
  price,
  productName,
}: CheckoutModalProps) {
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 모달이 닫히면 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setBuyerName("");
      setBuyerPhone("");
      setAgreedTerms(false);
      setErrorMsg("");
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // 검증
    if (!buyerName.trim()) {
      setErrorMsg("성함을 입력해주세요.");
      return;
    }

    const phoneClean = buyerPhone.replace(/[^0-9]/g, "");
    if (!phoneClean || phoneClean.length < 10 || phoneClean.length > 11) {
      setErrorMsg("올바른 연락처(휴대폰 번호)를 입력해주세요.");
      return;
    }

    if (!agreedTerms) {
      setErrorMsg("이용약관 및 개인정보 처리방침에 동의해야 합니다.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/payapp/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productKind,
          productCode,
          buyerName,
          buyerPhone: phoneClean,
          agreedTerms,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "결제 요청 중 서버 오류가 발생했습니다.");
      }

      if (data.success && data.payUrl) {
        // 페이앱 결제페이지로 이동
        window.location.href = data.payUrl;
      } else {
        throw new Error("결제 페이지 생성에 실패했습니다.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "결제 연동 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // 숫자와 하이픈만 허용하고 010-0000-0000 포맷 유도
    const clean = raw.replace(/[^0-9]/g, "");
    if (clean.length <= 3) {
      setBuyerPhone(clean);
    } else if (clean.length <= 7) {
      setBuyerPhone(`${clean.slice(0, 3)}-${clean.slice(3)}`);
    } else {
      setBuyerPhone(`${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7, 11)}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      <div 
        className="w-full max-w-md bg-[var(--surface-dark-2)] rounded-[24px] border border-[rgba(232,224,210,0.06)] shadow-2xl p-6 md:p-8 relative overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--coral)] opacity-5 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-[var(--coral)] uppercase mb-1 block">· CHECKOUT</span>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--cream)]">주문하기</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-[var(--cream-soft)] hover:text-[var(--cream)] p-1 rounded-full hover:bg-[rgba(232,224,210,0.05)] transition-all duration-200"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Product Details */}
        <div className="bg-[rgba(232,224,210,0.02)] border border-[rgba(232,224,210,0.04)] rounded-[16px] p-4 mb-6">
          <div className="text-[11px] font-mono text-[var(--cream-soft)] uppercase tracking-wider mb-1">선택한 상품</div>
          <div className="text-[15px] font-semibold text-[var(--cream)] mb-2 truncate">{productName}</div>
          <div className="flex justify-between items-baseline pt-2 border-t border-[rgba(232,224,210,0.04)]">
            <span className="text-xs text-[var(--cream-soft)]">최종 결제 금액</span>
            <span className="text-lg font-bold text-[var(--coral)]">₩{price.toLocaleString()}원</span>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="buyer-name" className="block text-xs font-semibold text-[var(--cream-soft)] mb-1.5">구매자 성함</label>
            <input
              id="buyer-name"
              type="text"
              required
              disabled={isLoading}
              placeholder="홍길동"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="w-full bg-[var(--surface-dark)] border border-[rgba(232,224,210,0.1)] rounded-[12px] px-4 py-3 text-sm text-[var(--cream)] placeholder-[var(--cream-soft)]/40 focus:outline-none focus:border-[var(--coral)] focus:ring-1 focus:ring-[var(--coral)] transition-all duration-200"
            />
          </div>

          <div>
            <label htmlFor="buyer-phone" className="block text-xs font-semibold text-[var(--cream-soft)] mb-1.5">휴대폰 번호 (알림톡 수신용)</label>
            <input
              id="buyer-phone"
              type="tel"
              required
              disabled={isLoading}
              placeholder="010-1234-5678"
              value={buyerPhone}
              onChange={handlePhoneChange}
              className="w-full bg-[var(--surface-dark)] border border-[rgba(232,224,210,0.1)] rounded-[12px] px-4 py-3 text-sm text-[var(--cream)] placeholder-[var(--cream-soft)]/40 focus:outline-none focus:border-[var(--coral)] focus:ring-1 focus:ring-[var(--coral)] transition-all duration-200"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="text-xs text-[rgba(229,148,120,0.9)] bg-[rgba(229,148,120,0.05)] border border-[rgba(229,148,120,0.15)] rounded-[8px] p-3 leading-relaxed">
              {errorMsg}
            </div>
          )}

          {/* Terms Agreement */}
          <AgreementCheckbox checked={agreedTerms} onChange={setAgreedTerms} />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !agreedTerms}
            className={`w-full py-4 rounded-[16px] font-bold text-center text-[var(--surface-dark)] transition-all duration-300 ${
              isLoading || !agreedTerms
                ? "bg-[rgba(232,224,210,0.15)] text-[var(--cream-soft)] cursor-not-allowed border border-[rgba(232,224,210,0.05)]"
                : "bg-[var(--coral)] hover:bg-[var(--coral-soft)] active:bg-[var(--coral-deep)] hover:shadow-[0_0_20px_rgba(229,148,120,0.25)]"
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-[var(--surface-dark)]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                결제창을 요청하고 있습니다...
              </span>
            ) : (
              "결제하기"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
