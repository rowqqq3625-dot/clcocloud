"use client";

import React, { useState, useEffect, useRef } from "react";
import TopupSlider from "./TopupSlider";

export default function TopupInquiryPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [usdValue, setUsdValue] = useState(1500);
  const [displayedUsd, setDisplayedUsd] = useState(1500);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [memo, setMemo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const prevValueRef = useRef(1500);
  const animationRef = useRef<number | null>(null);

  // 드래그 중인 값 변경 시 즉시 표시 값 업데이트
  const handleSliderChange = (val: number) => {
    setUsdValue(val);
    setDisplayedUsd(val);
  };

  // 드래그 종료 시 카운트업 애니메이션 (180ms)
  const handleDragEnd = (finalVal: number) => {
    const fromVal = prevValueRef.current;
    const toVal = finalVal;
    
    if (fromVal === toVal) return;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const duration = 180;
    const startTime = performance.now();

    const run = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(fromVal + (toVal - fromVal) * ease);
      setDisplayedUsd(currentVal);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(run);
      } else {
        setDisplayedUsd(toVal);
        prevValueRef.current = toVal;
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(run);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const clean = raw.replace(/[^0-9]/g, "");
    if (clean.length <= 3) {
      setBuyerPhone(clean);
    } else if (clean.length <= 7) {
      setBuyerPhone(`${clean.slice(0, 3)}-${clean.slice(3)}`);
    } else {
      setBuyerPhone(`${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7, 11)}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!buyerName.trim()) {
      setErrorMsg("성함을 입력해주세요.");
      return;
    }

    const phoneClean = buyerPhone.replace(/[^0-9]/g, "");
    if (!phoneClean || phoneClean.length < 10 || phoneClean.length > 11) {
      setErrorMsg("올바른 연락처(휴대폰 번호)를 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/topup/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          desiredUsd: usdValue,
          buyerName,
          buyerPhone: phoneClean,
          memo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "문의 접수 중 오류가 발생했습니다.");
      }

      // 부드러운 치환 (240ms)을 위한 state 처리
      setIsSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || "문의 접수에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  // KRW 환산 금액 계산
  const krwValue = displayedUsd * 400;

  return (
    <div className="w-full max-w-2xl mx-auto mt-6 font-sans">
      {/* 아코디언 토글 바 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 px-6 bg-[var(--surface-dark-2)] hover:bg-[rgba(232,224,210,0.04)] border border-[rgba(232,224,210,0.06)] rounded-[16px] flex justify-between items-center text-[var(--cream)] hover:text-white transition-all duration-300 shadow-md group"
      >
        <span className="text-sm font-semibold tracking-wide flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--coral)] animate-pulse" />
          대량 잔액 충전 문의 (커스텀 할인 적용)
        </span>
        <span className={`text-xs text-[var(--cream-soft)] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {/* 펼쳐지는 패널 */}
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{
          maxHeight: isOpen ? "800px" : "0px",
          opacity: isOpen ? 1 : 0,
          marginTop: isOpen ? "12px" : "0px",
        }}
      >
        <div className="bg-[var(--surface-dark-2)] border border-[rgba(232,224,210,0.08)] rounded-[20px] p-6 md:p-8 shadow-2xl relative">
          
          {!isSubmitted ? (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <span className="text-[10px] font-mono tracking-widest text-[var(--coral)] uppercase block mb-1">· CUSTOM INQUIRY</span>
                <h3 className="text-lg md:text-xl font-bold text-[var(--cream)]">원하시는 충전 금액을 설정해주세요</h3>
                <p className="text-xs text-[var(--cream-soft)] mt-1.5 leading-relaxed">
                  최소 $1,000부터 최대 $5,000까지 $100 단위로 조정 가능하며, <br className="hidden sm:inline" />
                  특별 우대 환율(1달러당 ₩400원)이 자동으로 적용됩니다.
                </p>
              </div>

              {/* 금액 디스플레이 */}
              <div className="flex flex-col items-center justify-center py-4 bg-[rgba(232,224,210,0.02)] border border-[rgba(232,224,210,0.04)] rounded-[16px] mb-6">
                <div className="text-3xl md:text-4xl font-extrabold text-[var(--cream)] tracking-tight font-mono">
                  ${displayedUsd.toLocaleString()}
                </div>
                <div className="text-xs font-semibold text-[var(--cream-soft)] mt-1 font-mono">
                  = ₩{krwValue.toLocaleString()}원 (VAT 미포함 기준)
                </div>
              </div>

              {/* 슬라이더 */}
              <TopupSlider
                min={1000}
                max={5000}
                step={100}
                value={usdValue}
                onChange={handleSliderChange}
                onDragEnd={handleDragEnd}
              />

              {/* 폼 */}
              <form onSubmit={handleSubmit} className="space-y-4 mt-6 pt-6 border-t border-[rgba(232,224,210,0.06)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="topup-name" className="block text-xs font-semibold text-[var(--cream-soft)] mb-1.5">이름 / 회사명</label>
                    <input
                      id="topup-name"
                      type="text"
                      required
                      disabled={isLoading}
                      placeholder="홍길동"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full bg-[var(--surface-dark)] border border-[rgba(232,224,210,0.08)] rounded-[12px] px-4 py-3 text-sm text-[var(--cream)] placeholder-[var(--cream-soft)]/30 focus:outline-none focus:border-[var(--coral)] focus:ring-1 focus:ring-[var(--coral)] transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="topup-phone" className="block text-xs font-semibold text-[var(--cream-soft)] mb-1.5">연락처 (알림톡 수신용)</label>
                    <input
                      id="topup-phone"
                      type="tel"
                      required
                      disabled={isLoading}
                      placeholder="010-1234-5678"
                      value={buyerPhone}
                      onChange={handlePhoneChange}
                      className="w-full bg-[var(--surface-dark)] border border-[rgba(232,224,210,0.08)] rounded-[12px] px-4 py-3 text-sm text-[var(--cream)] placeholder-[var(--cream-soft)]/30 focus:outline-none focus:border-[var(--coral)] focus:ring-1 focus:ring-[var(--coral)] transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="topup-memo" className="block text-xs font-semibold text-[var(--cream-soft)] mb-1.5">추가 메모 (선택)</label>
                  <textarea
                    id="topup-memo"
                    disabled={isLoading}
                    placeholder="용도, 필요 수량, 기타 희망 문의사항을 자유롭게 입력해 주세요."
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    rows={2}
                    className="w-full bg-[var(--surface-dark)] border border-[rgba(232,224,210,0.08)] rounded-[12px] px-4 py-3 text-sm text-[var(--cream)] placeholder-[var(--cream-soft)]/30 focus:outline-none focus:border-[var(--coral)] focus:ring-1 focus:ring-[var(--coral)] transition-all duration-200 resize-none"
                  />
                </div>

                {errorMsg && (
                  <div className="text-xs text-[rgba(229,148,120,0.9)] bg-[rgba(229,148,120,0.05)] border border-[rgba(229,148,120,0.15)] rounded-[8px] p-3 leading-relaxed">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 rounded-[16px] font-bold text-center text-[var(--surface-dark)] bg-[var(--coral)] hover:bg-[var(--coral-soft)] active:bg-[var(--coral-deep)] hover:shadow-[0_0_20px_rgba(229,148,120,0.2)] transition-all duration-300"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-[var(--surface-dark)]" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      문의를 접수하고 있습니다...
                    </span>
                  ) : (
                    "잔액충전 문의하기"
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-success-fade">
              {/* 코럴 체크 아이콘 */}
              <div className="w-16 h-16 rounded-full bg-[rgba(229,148,120,0.1)] border border-[var(--coral)] flex items-center justify-center text-[var(--coral)] mb-4 animate-scale-up">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[var(--cream)] mb-2">문의가 완료되었습니다</h3>
              <p className="text-sm text-[var(--cream-soft)] leading-relaxed max-w-sm">
                입력하신 연락처({buyerPhone})로 곧 안내 드리겠습니다. <br />
                기다려 주셔서 감사합니다.
              </p>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setBuyerName("");
                  setBuyerPhone("");
                  setMemo("");
                }}
                className="mt-6 text-xs text-[var(--coral)] hover:text-[var(--coral-soft)] border-b border-[var(--coral)] pb-0.5"
              >
                다른 문의 작성하기
              </button>
            </div>
          )}

        </div>
      </div>

      <style jsx global>{`
        @keyframes success-fade {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes scale-up {
          from {
            transform: scale(0.8);
          }
          to {
            transform: scale(1);
          }
        }
        .animate-success-fade {
          animation: success-fade 240ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .animate-scale-up {
          animation: scale-up 240ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>
    </div>
  );
}
