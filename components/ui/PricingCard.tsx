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
  const spotlight = useMotionTemplate`radial-gradient(280px circle at ${lightX} ${lightY}, ${
    popular ? "rgba(255, 255, 255, 0.38)" : "rgba(247, 241, 232, 0.16)"
  }, transparent 62%)`;

  const planNumber = id === "standard" ? "01" : id === "pro" ? "02" : "03";

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
      className={`group relative overflow-visible rounded-[28px] border p-7 transition duration-300 hover:-translate-y-[4px] ${
        popular
          ? "border-[3.5px] border-[rgba(255,255,255,0.48)] bg-[linear-gradient(135deg,#FFAFA0_0%,#F37053_30%,#D34324_65%,#8C1906_100%)] text-[var(--cream)] shadow-[0_32px_96px_rgba(226,97,66,0.45)] lg:-translate-y-5"
          : "border-[rgba(247,241,232,0.12)] bg-[linear-gradient(180deg,#242221_0%,#191716_100%)] text-[var(--cream)] hover:border-[rgba(247,241,232,0.24)] hover:shadow-[0_24px_64px_rgba(0,0,0,0.4)]"
      }`}
    >
      {popular ? (
        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--cream)] border border-[rgba(226,97,66,0.3)] px-4 py-1 text-[11px] font-bold text-[#E26142] tracking-[0.1em] shadow-[0_4px_16px_rgba(226,97,66,0.22)] z-10">
          ✦ 인기 플랜 ✦
        </span>
      ) : null}
      
      {/* Slanted Discount Badge on Top Right corner */}
      <DiscountBadge percent={discount} />

      {/* Glossy light sheen overlay for popular card */}
      {popular && (
        <>
          {/* Main Specular Highlight Grid Line */}
          <span className="pointer-events-none absolute inset-0 rounded-[28px] overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.4)_0%,rgba(255,255,255,0.12)_30%,rgba(255,255,255,0)_50%,rgba(255,255,255,0.08)_70%,rgba(255,255,255,0.25)_100%)] opacity-85 z-0" />
          {/* Continuous shimmer gloss sheen sweep */}
          <span className="pointer-events-none absolute inset-0 rounded-[28px] overflow-hidden opacity-60 z-0 mix-blend-overlay">
            <span className="absolute inset-[-100%] bg-[linear-gradient(105deg,transparent_35%,rgba(255,255,255,0.38)_45%,rgba(255,255,255,0.48)_48%,rgba(255,255,255,0.1)_52%,transparent_60%)] animate-shimmer-sweep" />
          </span>
        </>
      )}

      <motion.span className="pointer-events-none absolute inset-0 rounded-[28px] opacity-0 mix-blend-screen transition-opacity duration-200 group-hover:opacity-[.18]" style={{ background: spotlight }} />
      <span className="pointer-events-none absolute inset-0 rounded-[28px] opacity-[.05] noise" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="pr-10">
            {/* Index Manual Label (e.g. 01 / standard) */}
            <div className="flex items-center gap-2 mb-3 opacity-40 font-mono text-[10px] tracking-[0.14em] text-[var(--cream)]">
              <span>{planNumber}</span>
              <span className="h-px w-5 bg-[var(--cream)] opacity-50" />
              <span className="uppercase">{id}</span>
            </div>
            {/* Header font style upgraded: Newsreader font for Anthropic feel */}
            <h3 
              className="text-3xl font-semibold tracking-tight text-[var(--cream)]"
              style={{ fontFamily: "'Newsreader', serif" }}
            >
              {name}
            </h3>
            <p 
              className="mt-2.5 min-h-[3rem] text-balance leading-6 text-[var(--cream)]"
              style={{ opacity: popular ? 0.90 : 0.60 }}
            >
              {note}
            </p>
          </div>
        </div>
        <strong 
          className="mt-12 block text-[clamp(62px,8.2vw,98px)] font-medium leading-none tracking-[-.04em] text-[var(--cream)]"
          style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic" }}
        >
          $<CountUp end={balance} mode="slot" />
        </strong>
        <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--cream)]">{price}</p>
        <ul className="mt-8 grid gap-3 text-sm text-[var(--cream)]">
          {["공식 클로드코드 호환", "잔액 기간 만료 없음", "개인 전용 API 키"].map((item) => (
            <li key={item} className="flex items-center gap-3 text-[var(--cream)]" style={{ opacity: popular ? 0.90 : 0.72 }}>
              <span className="h-px w-4 origin-left bg-coral transition-transform duration-300 group-hover:scale-x-125" />
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-9 flex justify-center w-full">
          <PrimaryButton href={`/checkout?plan=${id}`} variant={popular ? "light" : "secondary"} arrow="→" pulse={popular} className="w-full max-w-[220px] justify-between min-h-[54px] rounded-[16px] shadow-md hover:shadow-lg">
            구매하기
          </PrimaryButton>
        </div>
      </div>
    </motion.article>
  );
}
