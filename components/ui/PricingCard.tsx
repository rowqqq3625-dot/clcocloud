"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { CountUp } from "@/components/ui/CountUp";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

type PricingCardProps = {
  name: string;
  balance: number;
  price: string;
  discount: number;
  note: string;
  popular: boolean;
};

export function PricingCard({ name, balance, price, discount, note, popular }: PricingCardProps) {
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
          ? "border-coral bg-[radial-gradient(circle_at_80%_0%,rgba(245,239,230,.26),transparent_36%),linear-gradient(145deg,var(--coral-hi),var(--coral),var(--coral-lo))] text-cream shadow-[0_24px_80px_rgba(217,119,87,.32)] lg:-translate-y-4"
          : "border-[var(--border-dark)] bg-dark-2 text-cream"
      }`}
    >
      {popular ? (
        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 animate-soft-float rounded-full border border-coral bg-cream px-4 py-1 text-xs font-semibold text-coral shadow-md">
          가장 많이 선택
        </span>
      ) : null}
      <motion.span className="pointer-events-none absolute inset-0 rounded-[28px] opacity-0 mix-blend-screen transition-opacity duration-200 group-hover:opacity-100" style={{ background: spotlight }} />
      <span className="pointer-events-none absolute inset-0 rounded-[28px] opacity-[.05] noise" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold">{name}</h3>
            <p className={popular ? "text-cream/74" : "text-cream/48"}>{note}</p>
          </div>
          <span className="rounded-full bg-cream/10 px-3 py-1 font-mono text-xs">
            약 <CountUp end={discount} suffix="%" mode="slot" /> 절감
          </span>
        </div>
        <strong className="mt-12 block text-[clamp(60px,8vw,104px)] font-semibold leading-none tracking-[-.06em]">
          $<CountUp end={balance} mode="slot" />
        </strong>
        <p className={`mt-3 text-3xl font-semibold ${popular ? "text-cream" : "text-coral-hi"}`}>{price}</p>
        <ul className="mt-8 grid gap-3 text-sm text-cream/72">
          {["공식 클로드코드 호환", "잔액 기간 만료 없음", "개인 전용 API 키"].map((item) => (
            <li key={item} className="flex items-center gap-3">
              <span className="h-px w-4 origin-left bg-coral transition-transform duration-300 group-hover:scale-x-125" />
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-9">
          <PrimaryButton href="#final" variant={popular ? "light" : "dark"} arrow="→" pulse={popular}>
            이 잔액으로 시작
          </PrimaryButton>
        </div>
      </div>
    </motion.article>
  );
}
