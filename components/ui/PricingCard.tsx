"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { CountUp } from "@/components/ui/CountUp";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { DiscountBadge } from "@/components/ui/DiscountBadge";

type PricingCardProps = {
  id: string;
  name: string;
  balance: number;
  price: string;
  discount: number;
  note: string;
  popular: boolean;
};

export function PricingCard({ id, name, balance, price, discount, note, popular }: PricingCardProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), { stiffness: 220, damping: 26 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), { stiffness: 220, damping: 26 });
  const lightX = useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"]);
  const lightY = useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"]);
  const spotlight = useMotionTemplate`radial-gradient(240px circle at ${lightX} ${lightY}, rgba(232,144,114,.22), transparent 58%)`;

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
      className={`group relative overflow-visible rounded-[28px] border p-7 transition duration-300 hover:-translate-y-2 ${
        popular
          ? "border-[3px] border-[var(--coral)] bg-[#FFFCF6] text-[#1A1817] shadow-[0_32px_100px_rgba(217,119,87,0.18)] lg:-translate-y-4"
          : "border-[var(--border-dark)] bg-dark-2 text-[var(--cream)]"
      }`}
    >
      {popular ? (
        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--coral)] px-4 py-1.5 text-xs font-bold text-white shadow-md z-10 tracking-wide">
          인기 플랜
        </span>
      ) : null}
      
      {/* Slanted Discount Badge on Top Right corner */}
      <DiscountBadge percent={discount} />

      <motion.span className="pointer-events-none absolute inset-0 rounded-[28px] opacity-0 mix-blend-screen transition-opacity duration-200 group-hover:opacity-100" style={{ background: spotlight }} />
      <span className="pointer-events-none absolute inset-0 rounded-[28px] opacity-[.05] noise" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="pr-10">
            <h3 className={`text-2xl font-semibold ${popular ? "text-[#1A1817]" : "text-[var(--cream)]"}`}>{name}</h3>
            <p 
              className={`mt-2 ${popular ? "text-[#1A1817]" : "text-[var(--cream)]"}`}
              style={{ opacity: popular ? 0.80 : 0.48 }}
            >
              {note}
            </p>
          </div>
        </div>
        <strong className={`mt-12 block text-[clamp(60px,8vw,104px)] font-semibold leading-none tracking-[-.06em] ${popular ? "text-[#1A1817]" : "text-[var(--cream)]"}`}>
          $<CountUp end={balance} mode="slot" />
        </strong>
        <p className={`mt-3 text-3xl font-semibold ${popular ? "text-[#1A1817]" : "text-[var(--cream)]"}`}>{price}</p>
        <ul className={`mt-8 grid gap-3 text-sm ${popular ? "text-[#1A1817]" : "text-[var(--cream)]"}`}>
          {["공식 클로드코드 호환", "잔액 기간 만료 없음", "개인 전용 API 키"].map((item) => (
            <li key={item} className={`flex items-center gap-3 ${popular ? "text-[#1A1817]" : "text-[var(--cream)]"}`} style={{ opacity: popular ? 0.90 : 0.72 }}>
              <span className="h-px w-4 origin-left bg-coral transition-transform duration-300 group-hover:scale-x-125" />
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-9 flex justify-center w-full">
          <PrimaryButton href={`/checkout?plan=${id}`} variant={popular ? "dark" : "secondary"} arrow="→" pulse={popular} className="w-full max-w-[220px] justify-between min-h-[54px] rounded-[16px] shadow-md hover:shadow-lg">
            구매하기
          </PrimaryButton>
        </div>
      </div>
    </motion.article>
  );
}
