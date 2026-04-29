"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { CountUp } from "@/components/ui/CountUp";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

type PricingCardTiltProps = {
  id: string;
  name: string;
  balance: number;
  price: number;
  label: string;
  discount: number;
  note: string;
  popular: boolean;
};

export function PricingCardTilt({
  id,
  name,
  balance,
  price,
  discount,
  note,
  popular
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
      className={`group relative grid min-h-[540px] min-w-0 grid-rows-[auto_auto_auto_1fr_auto] overflow-visible rounded-[28px] border p-7 transition duration-300 will-change-transform hover:-translate-y-2 ${
        popular
          ? "border-coral bg-[radial-gradient(circle_at_80%_0%,var(--bg-cream)_0%,transparent_36%),linear-gradient(145deg,var(--coral-hi),var(--coral),var(--coral-lo))] text-cream shadow-[0_24px_80px_var(--coral-glow)] lg:-translate-y-2"
          : "border-[var(--border-dark)] bg-dark-2 text-cream"
      }`}
    >
      {popular ? (
        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-coral bg-cream px-4 py-1 text-xs font-semibold text-coral shadow-md">
          가장 많이 선택
        </span>
      ) : null}
      <motion.span className="pointer-events-none absolute inset-0 rounded-[28px] opacity-0 mix-blend-screen transition-opacity duration-200 group-hover:opacity-[.18]" style={{ background: spotlight }} />
      <span className="pointer-events-none absolute inset-0 rounded-[28px] opacity-[.05] noise" />
      <div className="relative min-w-0">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-2xl font-semibold">{name}</h3>
            <p className={`${popular ? "text-cream/74" : "text-cream/48"} mt-2 min-h-[3rem] text-balance leading-6`}>{note}</p>
          </div>
          <span className="rounded-full bg-cream/10 px-3 py-1 font-mono text-xs">
            약 <CountUp end={discount} suffix="%" duration={700} delay={80} /> 절감
          </span>
        </div>
      </div>
      <div className="relative mt-10 min-w-0">
        <motion.strong
          initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="block text-[clamp(60px,8vw,104px)] font-semibold leading-none tracking-[-.06em]"
        >
          <CountUp end={balance} prefix="$" duration={950} delay={120} />
        </motion.strong>
        <p className={`mt-3 text-3xl font-semibold tracking-[-0.03em] ${popular ? "text-cream" : "text-coral-hi"}`}>
          <CountUp end={price} prefix="₩" grouped duration={1050} delay={220} />
        </p>
      </div>
      <ul className="relative mt-8 grid content-start gap-3 self-start text-sm text-cream/72">
        {["공식 클로드코드 호환", "잔액 기간 만료 없음", "개인 전용 API 키"].map((item, index) => (
          <motion.li
            key={item}
            className="flex items-center gap-3"
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
      <motion.div className="relative mt-9 self-end" style={{ x: shiftX, y: shiftY }}>
        <PrimaryButton href={`/checkout?plan=${id}`} variant={popular ? "light" : "dark"} arrow="→" pulse={popular}>
          이 잔액으로 시작
        </PrimaryButton>
      </motion.div>
    </motion.article>
  );
}
