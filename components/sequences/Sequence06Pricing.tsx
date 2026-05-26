"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import TopupInquiryPanel from "@/components/topup/TopupInquiryPanel";
import { PricingCardTilt } from "@/components/ui/PricingCardTilt";
import { pricingPlansWithDiscount } from "@/lib/pricing";
import CheckoutModal from "@/components/checkout/CheckoutModal";
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal";

export function Sequence06Pricing() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    code: string;
    price: number;
    name: string;
  } | null>(null);

  const handleSelectPlan = async (code: string, price: number, name: string) => {
    try {
      const res = await fetch("/api/session", { cache: "no-store" });
      const data = await res.json();
      if (!data.authenticated) {
        setShowLoginModal(true);
        return;
      }
    } catch {
      setShowLoginModal(true);
      return;
    }

    setSelectedPlan({ code, price, name });
    setIsCheckoutOpen(true);
  };

  const handleCheckoutClose = () => {
    setIsCheckoutOpen(false);
    setSelectedPlan(null);
  };

  return (
    <section id="pricing" className="dark-panel py-32">
      <div className="container-cinematic">
        <p className="eyebrow">Pricing</p>
        <h2 className="section-display mt-5 max-w-5xl text-[clamp(44px,6vw,88px)] font-semibold leading-[1.2]">
          기간 만료 없이,<br />
          필요한 만큼 구매하세요.
        </h2>
        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {pricingPlansWithDiscount.map((plan, index) => (
            <motion.div
              id={`plan-${plan.id}`}
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <PricingCardTilt
                {...plan}
                onSelectPlan={handleSelectPlan}
              />
            </motion.div>
          ))}
        </div>
        <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.12em] opacity-60">
          API 키 발급 후 잔액을 사용한 경우 환불 불가. API 키 자체가 사용 불가로 판단될 경우 교체 또는 환불을 지원합니다.
        </p>

        {/* Separator line and 40px spacing */}
        <div className="mt-12 mb-10 h-[0.5px] w-full bg-[rgba(247,241,232,0.1)]" />
        
        {/* 잔액충전 문의 드래그 슬라이더 아코디언 */}
        <TopupInquiryPanel />
      </div>

      {/* 결제하기 모달 */}
      {isCheckoutOpen && selectedPlan && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={handleCheckoutClose}
          productKind="balance"
          productCode={selectedPlan.code}
          price={selectedPlan.price}
          productName={selectedPlan.name}
        />
      )}

      {/* 로그인 유도 모달 */}
      <LoginRequiredModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        returnTo="/#pricing"
      />
    </section>
  );
}
