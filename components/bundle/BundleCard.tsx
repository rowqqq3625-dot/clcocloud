"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BundleCardProps {
  productCode: string;
  displayName: string;
  aiPartner: string;
  description: string;
  periodMonths: number | null;
  includedBalance: number | null;
  priceKrw: number | null;
  originalPriceKrw: number | null;
  isFeatured: boolean;
  onCheckout: (code: string, price: number, name: string) => void;
  index: number;
}

export default function BundleCard({
  productCode,
  displayName,
  aiPartner,
  description,
  periodMonths,
  includedBalance,
  priceKrw,
  originalPriceKrw,
  isFeatured,
  onCheckout,
  index,
}: BundleCardProps) {
  const isAvailable = priceKrw !== null;
  const [formOpen, setFormOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  // 파트너별 표시용 텍스트
  let partnerDisplay = "GEMINI";
  if (aiPartner === "gpt") {
    partnerDisplay = "GPT";
  } else if (aiPartner === "perplexity") {
    partnerDisplay = "PERPLEXITY";
  }

  // 모션 제어 (prefers-reduced-motion 대응)
  const isReduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const cardVariants = {
    hidden: { opacity: 0, y: isReduced ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: isReduced ? 0 : 0.4,
        ease: [0.22, 1, 0.36, 1],
        delay: isReduced ? 0 : index * 0.08,
      },
    },
  };

  const handleMainAction = () => {
    if (isAvailable && priceKrw) {
      onCheckout(productCode, priceKrw, displayName);
    } else {
      setFormOpen((prev) => !prev);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    const phoneClean = phone.replace(/[^0-9]/g, "");
    if (!phoneClean || phoneClean.length < 10) {
      setErrorMsg("올바른 휴대폰 번호를 입력해주세요.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/topup/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          desiredUsd: 1000, // 최소값 고정으로 유효성 검사 통과
          buyerName: "AI 번들 알림 신청자",
          buyerPhone: phoneClean,
          memo: `[AI 번들 출시 알림 신청] ${displayName}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "알림 신청에 실패했습니다. 다시 시도해주세요.");
      } else {
        setSuccess(true);
        setPhone("");
        setTimeout(() => {
          setFormOpen(false);
          setSuccess(false);
        }, 2200);
      }
    } catch (err) {
      setErrorMsg("서버 오류로 인해 접수에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusBadge = () => (
    <span className="inline-flex px-2 py-0.5 text-[9px] font-semibold tracking-wider border border-[rgba(232,224,210,0.06)] bg-[rgba(232,224,210,0.04)] rounded text-[var(--cream-soft)]/50 select-none">
      준비 중
    </span>
  );

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className={`relative w-full rounded-[20px] p-8 border flex flex-col gap-6 overflow-hidden transition-all duration-300 ${
        isFeatured
          ? "bg-gradient-to-br from-[var(--surface-dark-2)] via-[var(--surface-dark-2)] to-[rgba(229,148,120,0.06)] border-[rgba(229,148,120,0.22)] shadow-[inset_0_0_24px_rgba(229,148,120,0.05)] hover:shadow-[inset_0_0_32px_rgba(229,148,120,0.12)]"
          : "bg-[var(--surface-dark-2)] border-[rgba(232,224,210,0.08)] shadow-[inset_0_0_24px_rgba(247,241,232,0.02)] hover:shadow-[inset_0_0_32px_rgba(247,241,232,0.05)]"
      } group hover:-translate-y-[3px]`}
      style={{
        "--line-opacity": isFeatured ? "0.18" : "0.08",
      } as React.CSSProperties}
    >
      {/* 1px sweep line animation */}
      {!isReduced && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          <div className="absolute w-[200%] h-[200%] top-[-50%] left-[-50%] bg-gradient-to-r from-transparent via-[var(--coral)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-sweep" 
               style={{ 
                 transform: "rotate(45deg)", 
                 mixBlendMode: "overlay" 
               }} />
        </div>
      )}

      {/* Featured Badge */}
      {isFeatured && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--coral)] text-[var(--surface-dark)] px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-[0_2px_8px_rgba(229,148,120,0.3)] z-10">
          가장 많이 선택
        </div>
      )}

      {/* Header Slot */}
      <div className="flex justify-between items-center relative z-[2]">
        <span className="font-mono text-[11px] font-bold tracking-[0.12em] text-[var(--cream-soft)] uppercase">
          BUNDLE · {partnerDisplay}
        </span>
        
        {/* 우상단 5px 코럴 점 */}
        <div className="relative flex h-2 w-2">
          {isFeatured && (
            <span className="animate-dot-pulse absolute inline-flex h-full w-full rounded-full bg-[var(--coral)] opacity-75" />
          )}
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--coral)]" />
        </div>
      </div>

      {/* Title & Description */}
      <div className="flex flex-col gap-2 relative z-[2]">
        <h3 className="text-2xl font-bold tracking-tight text-[var(--cream)] leading-snug">
          {displayName}
        </h3>
        <p className="text-xs text-[var(--cream-soft)]/70 leading-relaxed font-sans min-h-[36px]">
          {description}
        </p>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-[var(--coral)] to-transparent opacity-[var(--line-opacity)] my-1" />

      {/* Product inclusion features */}
      <ul className="flex flex-col gap-3 relative z-[2] font-mono text-[12px] text-[var(--cream-soft)]/90">
        <li className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-[var(--coral)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>클로드코드 API 키 잔액</span>
          </div>
          <span className="text-right">
            {includedBalance ? `$${includedBalance.toLocaleString()}` : renderStatusBadge()}
          </span>
        </li>
        <li className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-[var(--coral)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>{partnerDisplay} 구독 연동</span>
          </div>
          <span className="text-right">
            {periodMonths ? `${periodMonths}개월` : renderStatusBadge()}
          </span>
        </li>
        <li className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-[var(--coral)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>이용 기간</span>
          </div>
          <span className="text-right">
            {periodMonths ? `${periodMonths}개월` : renderStatusBadge()}
          </span>
        </li>
      </ul>

      {/* Price section */}
      <div className="mt-auto pt-4 flex flex-col gap-1.5 relative z-[2]">
        {isAvailable ? (
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] uppercase font-mono text-[var(--cream-soft)]/60">패키지 특가</span>
              <div className="flex flex-col items-end">
                {originalPriceKrw && (
                  <span className="text-xs line-through text-[var(--cream-soft)]/40 font-mono">
                    ₩{originalPriceKrw.toLocaleString()}원
                  </span>
                )}
                <span className="text-2xl font-bold tracking-tight text-[var(--cream)] font-mono">
                  ₩{priceKrw?.toLocaleString()}원
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center py-2">
            <span className="text-[10px] uppercase font-mono text-[var(--cream-soft)]/60">출시 일정</span>
            {renderStatusBadge()}
          </div>
        )}
      </div>

      {/* Form Slide area (Inquiry Form) */}
      <AnimatePresence>
        {formOpen && !isAvailable && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden relative z-[2] border-t border-[rgba(232,224,210,0.06)] pt-4"
          >
            {success ? (
              <div className="py-3 text-center text-xs font-semibold text-[var(--coral-soft)] font-sans">
                ✓ 출시 알림 신청이 완료되었습니다!
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="flex flex-col gap-2.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="휴대폰 번호 (010-XXXX-XXXX)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={submitting}
                    className="flex-1 rounded-lg bg-[var(--surface-dark)] border border-[rgba(232,224,210,0.12)] px-3 py-2 text-xs text-[var(--cream)] placeholder-[var(--cream-soft)]/35 focus:outline-none focus:border-[var(--coral)] transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-[var(--coral)] px-4 py-2 text-xs font-bold text-[var(--surface-dark)] hover:bg-[var(--coral-soft)] active:bg-[var(--coral-deep)] disabled:opacity-50 transition-colors"
                  >
                    {submitting ? "신청중" : "신청"}
                  </button>
                </div>
                {errorMsg && (
                  <p className="text-[10px] text-red-400 font-sans tracking-wide">
                    {errorMsg}
                  </p>
                )}
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA Button */}
      <button
        onClick={handleMainAction}
        disabled={!isAvailable}
        className={`w-full py-3.5 rounded-xl font-bold text-center text-xs tracking-wider transition-all duration-300 relative z-[2] ${
          isAvailable
            ? "bg-[var(--coral)] text-[var(--surface-dark)] hover:bg-[var(--coral-soft)] active:bg-[var(--coral-deep)] hover:shadow-[0_4px_16px_rgba(229,148,120,0.25)] cursor-pointer"
            : "bg-[rgba(232,224,210,0.04)] text-[var(--cream-soft)]/30 border border-[rgba(232,224,210,0.01)] cursor-not-allowed"
        }`}
      >
        {isAvailable ? "이 패키지로 시작 →" : "준비 중"}
      </button>

      <style jsx global>{`
        @keyframes sweep-animation {
          0% {
            transform: translate(-150%, -150%) rotate(45deg);
          }
          100% {
            transform: translate(150%, 150%) rotate(45deg);
          }
        }
        .animate-sweep {
          animation: sweep-animation 3.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
        }
        @keyframes dot-pulse-animation {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(217, 119, 87, 0.7);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 6px rgba(217, 119, 87, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(217, 119, 87, 0);
          }
        }
        .animate-dot-pulse {
          animation: dot-pulse-animation 1s infinite;
        }
      `}</style>
    </motion.div>
  );
}
