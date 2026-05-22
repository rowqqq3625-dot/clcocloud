"use client";

import React, { useState, useEffect } from "react";
import BundleCard from "./BundleCard";
import CheckoutModal from "../checkout/CheckoutModal";

interface BundleProduct {
  id: string;
  product_code: string;
  display_name: string;
  ai_partner: string;
  description: string;
  period_months: number | null;
  included_balance: number | null;
  price_krw: number | null;
  original_price_krw: number | null;
  is_featured: boolean;
  is_active: boolean;
}

const DEFAULT_BUNDLES = [
  {
    product_code: "BUNDLE_GEMINI",
    display_name: "클코클라우드 × Gemini",
    ai_partner: "gemini",
    description: "Google Gemini Advanced 구독과 공식 클로드코드 API 키 결합. 이미지 분석 및 멀티모달 연동 강점.",
    period_months: null,
    included_balance: null,
    price_krw: null,
    original_price_krw: null,
    is_featured: false,
  },
  {
    product_code: "BUNDLE_GPT",
    display_name: "클코클라우드 × GPT",
    ai_partner: "gpt",
    description: "OpenAI ChatGPT Plus 구독과 공식 클로드코드 API 키 결합. 가장 대중적이고 넓은 커뮤니티 생태계 연동.",
    period_months: null,
    included_balance: null,
    price_krw: null,
    original_price_krw: null,
    is_featured: true, // 기본 Featured (PRO 느낌)
  },
  {
    product_code: "BUNDLE_PERPLEXITY",
    display_name: "클코클라우드 × Perplexity",
    ai_partner: "perplexity",
    description: "Perplexity Pro 구독과 공식 클로드코드 API 키 결합. 웹 검색 정보에 기반한 실시간 지식 코딩 연동.",
    period_months: null,
    included_balance: null,
    price_krw: null,
    original_price_krw: null,
    is_featured: false,
  },
];

export default function BundleSection() {
  const [bundles, setBundles] = useState<any[]>(DEFAULT_BUNDLES);
  
  // 결제 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{
    code: string;
    price: number;
    name: string;
  } | null>(null);

  useEffect(() => {
    async function fetchBundles() {
      try {
        const res = await fetch("/api/bundle-products");
        const json = await res.json();
        
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          // DB에 등록된 활성화 상품들로 기본 뼈대 갱신
          const dbItems: BundleProduct[] = json.data;
          
          const merged = DEFAULT_BUNDLES.map((def) => {
            const dbMatch = dbItems.find((item) => item.product_code === def.product_code);
            if (dbMatch) {
              return {
                product_code: dbMatch.product_code,
                display_name: dbMatch.display_name,
                ai_partner: dbMatch.ai_partner,
                description: dbMatch.description || def.description,
                period_months: dbMatch.period_months,
                included_balance: dbMatch.included_balance ? Number(dbMatch.included_balance) : null,
                price_krw: dbMatch.price_krw,
                original_price_krw: dbMatch.original_price_krw,
                is_featured: dbMatch.is_featured,
              };
            }
            return def;
          });
          
          // 혹시 기본 3종 외에 DB에 새로 등록된 번들이 있다면 추가 노출
          const extraItems = dbItems.filter(
            (dbItem) => !DEFAULT_BUNDLES.some((def) => def.product_code === dbItem.product_code)
          ).map(dbMatch => ({
            product_code: dbMatch.product_code,
            display_name: dbMatch.display_name,
            ai_partner: dbMatch.ai_partner,
            description: dbMatch.description || "",
            period_months: dbMatch.period_months,
            included_balance: dbMatch.included_balance ? Number(dbMatch.included_balance) : null,
            price_krw: dbMatch.price_krw,
            original_price_krw: dbMatch.original_price_krw,
            is_featured: dbMatch.is_featured,
          }));

          setBundles([...merged, ...extraItems]);
        }
      } catch (err) {
        console.error("Error loading bundle products, showing placeholders:", err);
      }
    }
    fetchBundles();
  }, []);

  const handleCheckoutOpen = (code: string, price: number, name: string) => {
    setModalData({ code, price, name });
    setIsModalOpen(true);
  };

  const handleCheckoutClose = () => {
    setIsModalOpen(false);
    setModalData(null);
  };

  return (
    <section className="cc-section bg-[var(--surface-dark)] text-[var(--cream)] relative py-24 px-5 lg:px-12 border-t border-[rgba(232,224,210,0.04)]">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div className="flex gap-4">
            {/* 좌측 코럴 수직선 */}
            <div className="w-1 bg-[var(--coral)] rounded-full" />
            <div>
              <span className="cc-eyebrow cc-eyebrow-dot block text-xs tracking-widest text-[var(--coral)] uppercase">
                · AI BUNDLE
              </span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-[var(--cream)] mt-1.5 leading-tight">
                AI 도구를 묶어서, 더 가볍게.
              </h2>
              <p className="text-sm text-[var(--cream-soft)]/60 mt-2 max-w-xl leading-relaxed">
                공식 클로드코드 API 키에 검증된 AI 구독을 결합한 패키지
              </p>
            </div>
          </div>
          
          {/* 우측 상단 미니 메타 */}
          <div className="font-mono text-[11px] tracking-wider text-[var(--cream-soft)]/50 select-none pb-1">
            · 3 packages · 출시 준비
          </div>
        </div>

        {/* 3개 패키지 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {bundles.map((bundle, index) => (
            <BundleCard
              key={bundle.product_code}
              productCode={bundle.product_code}
              displayName={bundle.display_name}
              aiPartner={bundle.ai_partner}
              description={bundle.description}
              periodMonths={bundle.period_months}
              includedBalance={bundle.included_balance}
              priceKrw={bundle.price_krw}
              originalPriceKrw={bundle.original_price_krw}
              isFeatured={bundle.is_featured}
              onCheckout={handleCheckoutOpen}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Checkout Modal */}
      {isModalOpen && modalData && (
        <CheckoutModal
          isOpen={isModalOpen}
          onClose={handleCheckoutClose}
          productKind="bundle"
          productCode={modalData.code}
          price={modalData.price}
          productName={modalData.name}
        />
      )}
    </section>
  );
}
