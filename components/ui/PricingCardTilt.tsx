"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { CountUp } from "@/components/ui/CountUp";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Price } from "@/components/ui/Price";
import { DiscountBadge } from "@/components/ui/DiscountBadge";

type PricingCardTiltProps = {
  id: string;
  name: string;
  balance: number;
  price: number;
  label: string;
  discount: number;
  note: string;
  popular: boolean;
  onSelectPlan?: (planId: string, price: number, name: string) => void;
};

export function PricingCardTilt({
  id,
  name,
  balance,
  price,
  discount,
  note,
  popular,
  onSelectPlan
}: PricingCardTiltProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 220, damping: 26 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), { stiffness: 220, damping: 26 });
  const shiftX = useTransform(mouseX, [-0.5, 0.5], [-8, 8]);
  const shiftY = useTransform(mouseY, [-0.5, 0.5], [-6, 6]);
  const lightX = useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"]);
  const lightY = useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"]);
  const spotlight = useMotionTemplate`radial-gradient(240px circle at ${lightX} ${lightY}, var(--coral), transparent 58%)`;

  return (
    <motion.article
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        mouseX.set((event.clientX - rect.left) / rect.width - 0.5);
        mouseY.set((event.clientY - rect.top) / rect.height - 0.5);
      }}
      onMouseLeave={() => {
        mouseX.set(0);
        mouseY.set(0);
      }}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      className={`group relative grid min-h-[540px] min-w-0 grid-rows-[auto_auto_auto_1fr_auto] overflow-visible rounded-[28px] border p-7 transition duration-300 will-change-transform hover:-translate-y-[3px] ${
        popular
          ? "border-[3px] border-[#1A1817] bg-[var(--cream)] text-[#1A1817] shadow-[0_32px_100px_rgba(31,30,29,0.18)] lg:-translate-y-4"
          : "border-[rgba(247,241,232,0.08)] bg-dark-2 text-[var(--cream)] hover:border-white/20 hover:shadow-lg"
      }`}
    >
      {popular ? (
        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1A1817] px-4 py-1.5 text-xs font-bold text-[var(--cream)] shadow-md z-10 tracking-wide">
          인기 플랜
        </span>
      ) : null}

      {/* Slanted Discount Badge on Top Right corner */}
      <DiscountBadge percent={discount} />

      <motion.span className="pointer-events-none absolute inset-0 rounded-[28px] opacity-0 mix-blend-screen transition-opacity duration-200 group-hover:opacity-[.18]" style={{ background: spotlight }} />
      <span className="pointer-events-none absolute inset-0 rounded-[28px] opacity-[.05] noise" />
      
      <div className="relative min-w-0">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div className="min-w-0 pr-10"> {/* Extra padding-right to avoid overlapping with absolute DiscountBadge */}
            {/* Header font style upgraded: weight 640, tracking -0.01em */}
            <h3 className={`text-2xl font-[640] tracking-[-0.01em] ${popular ? "text-[#1A1817]" : "text-[var(--cream)]"}`}>{name}</h3>
            <p 
              className={`mt-2 min-h-[3rem] text-balance leading-6 ${popular ? "text-[#1A1817]" : "text-[var(--cream)]"}`}
              style={{ opacity: popular ? 0.80 : 0.60 }}
            >
              {note}
            </p>
          </div>
        </div>
      </div>

      {/* Price section with Unified Price component */}
      <div className="relative mt-10 min-w-0">
        <motion.strong
          initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className={`block text-[clamp(60px,8vw,104px)] font-semibold leading-none tracking-[-.06em] ${popular ? "text-[#1A1817]" : "text-[var(--cream)]"}`}
        >
          <CountUp end={balance} prefix="$" duration={950} delay={120} />
        </motion.strong>
        <div className={`mt-3 text-3xl font-semibold tracking-[-0.03em] ${popular ? "text-[#1A1817]" : "text-[var(--cream)]"}`}>
          <Price krw={price} usd={balance} className={popular ? "text-[#1A1817]" : "text-[var(--cream)]"} />
        </div>
      </div>

      <ul className={`relative mt-8 grid content-start gap-3 self-start text-sm ${popular ? "text-[#1A1817]" : "text-[var(--cream)]"}`}>
        {["공식 클로드코드 호환", "잔액 기간 만료 없음", "개인 전용 API 키"].map((item, index) => (
          <motion.li
            key={item}
            className={`flex items-center gap-3 ${popular ? "text-[#1A1817]" : "text-[var(--cream)]"}`}
            style={{ opacity: popular ? 0.90 : 0.85 }}
            initial={{ opacity: 0, x: -6 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.32, delay: index * 0.08 }}
          >
            <span className="h-px w-4 origin-left bg-coral transition-transform duration-300 group-hover:scale-x-125" />
            {item}
          </motion.li>
        ))}
      </ul>

      {/* Button aligned compactly and plumply */}
      <motion.div className="relative mt-9 self-end w-full flex justify-center" style={{ x: shiftX, y: shiftY }}>
        <PrimaryButton
          onClick={onSelectPlan ? () => onSelectPlan(id.toUpperCase(), price, `${name} 플랜 ($${balance})`) : undefined}
          href={onSelectPlan ? undefined : `/checkout?plan=${id}`}
          variant={popular ? "dark" : "secondary"}
          arrow="→"
          pulse={popular}
          className="w-full max-w-[220px] justify-between min-h-[54px] rounded-[16px] shadow-md hover:shadow-lg"
        >
          구매하기
        </PrimaryButton>
      </motion.div>
    </motion.article>
  );
}
