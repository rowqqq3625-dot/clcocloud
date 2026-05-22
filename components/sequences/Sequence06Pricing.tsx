"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import TopupInquiryPanel from "@/components/topup/TopupInquiryPanel";
import { PricingCardTilt } from "@/components/ui/PricingCardTilt";
import { pricingPlansWithDiscount } from "@/lib/pricing";
import CheckoutModal from "@/components/checkout/CheckoutModal";

export function Sequence06Pricing() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    code: string;
    price: number;
    name: string;
  } | null>(null);

  const handleSelectPlan = (code: string, price: number, name: string) => {
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
        <h2 className="section-display mt-5 max-w-5xl text-[clamp(44px,6vw,88px)] font-semibold">
          기간 만료 없이, 필요한 만큼 구매하세요.
        </h2>
        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {pricingPlansWithDiscount.map((plan, index) => (
            <motion.div
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
        <p className="mt-8 text-sm leading-6 text-cream/50">
          API 키 발급 후 잔액을 사용한 경우 환불 불가. API 키 자체가 사용 불가로 판단될 경우 교체 또는 환불을 지원합니다.
        </p>
        
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
    </section>
  );
}
