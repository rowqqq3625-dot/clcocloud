"use client";

import React from "react";
import { motion } from "framer-motion";

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

  // 파트너별 표시용 텍스트 및 로고 이니셜/플레이스홀더
  let partnerDisplay = "Gemini";
  let logoInitial = "G";
  if (aiPartner === "gpt") {
    partnerDisplay = "GPT";
    logoInitial = "O";
  } else if (aiPartner === "perplexity") {
    partnerDisplay = "Perplexity";
    logoInitial = "P";
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

  const handleClick = () => {
    if (isAvailable && priceKrw) {
      onCheckout(productCode, priceKrw, displayName);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className={`relative w-full rounded-[20px] p-8 border flex flex-col gap-5 overflow-hidden transition-all duration-300 ${
        isFeatured
          ? "bg-gradient-to-br from-[var(--surface-dark-2)] via-[var(--surface-dark-2)] to-[rgba(229,148,120,0.06)] border-[rgba(229,148,120,0.22)] shadow-[inset_0_0_24px_rgba(229,148,120,0.05)] hover:shadow-[inset_0_0_32px_rgba(229,148,120,0.12)]"
          : "bg-[var(--surface-dark-2)] border-[rgba(232,224,210,0.08)] shadow-[inset_0_0_20px_rgba(232,224,210,0.01)] hover:shadow-[inset_0_0_24px_rgba(229,148,120,0.08)]"
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
        {/* Monogram logo slot */}
        <div className="w-9 h-9 rounded-xl bg-[rgba(229,148,120,0.08)] border border-[rgba(229,148,120,0.15)] flex items-center justify-center text-[var(--coral)] font-bold text-sm select-none">
          {logoInitial}
        </div>
        <span className="font-mono text-[10px] tracking-widest text-[var(--cream-soft)] opacity-60 uppercase">
          BUNDLE · {partnerDisplay}
        </span>
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
        <li className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-[var(--coral)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>
            클로드코드 API 키 잔액 ─ {includedBalance ? `$${includedBalance.toLocaleString()}` : "운영자 설정"}
          </span>
        </li>
        <li className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-[var(--coral)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>
            {partnerDisplay} 구독 ─ {periodMonths ? `${periodMonths}개월 연동` : "운영자 설정"}
          </span>
        </li>
        <li className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-[var(--coral)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>
            기간 ─ {periodMonths ? `${periodMonths}개월` : "운영자 설정"}
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
            <span className="px-2.5 py-1 text-[10px] font-semibold border border-[var(--coral-soft)]/30 rounded-full text-[var(--coral-soft)] bg-[rgba(229,148,120,0.04)]">
              준비 중
            </span>
          </div>
        )}
      </div>

      {/* CTA Button */}
      <button
        onClick={handleClick}
        disabled={!isAvailable}
        className={`w-full py-3.5 rounded-xl font-bold text-center text-xs tracking-wider transition-all duration-300 relative z-[2] ${
          isAvailable
            ? "bg-[var(--coral)] text-[var(--surface-dark)] hover:bg-[var(--coral-soft)] active:bg-[var(--coral-deep)] hover:shadow-[0_4px_16px_rgba(229,148,120,0.25)]"
            : "bg-[rgba(232,224,210,0.06)] text-[var(--cream-soft)]/40 cursor-not-allowed border border-[rgba(232,224,210,0.02)] hover:bg-[rgba(232,224,210,0.08)]"
        }`}
      >
        {isAvailable ? "이 패키지로 시작 →" : "곧 만나요"}
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
      `}</style>
    </motion.div>
  );
}
