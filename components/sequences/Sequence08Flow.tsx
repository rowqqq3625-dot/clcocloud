"use client";

import { motion } from "framer-motion";
import { CCAnimatedContent } from "@/components/reactbits-wrapped/CCAnimatedContent";
import { CCSplitText } from "@/components/reactbits-wrapped/CCSplitText";
import { insertWordBreaks } from "@/lib/text-utils";

const steps = [
  ["1", "잔액 플랜 선택", "# ₩98,000 / ₩196,000 / ₩264,000"],
  ["2", "API 키 발급", "$ key issued: sk-clco-xxxx-xxxx-xxxx"],
  ["3", "공식 클로드코드에 연결", "$ export ANTHROPIC_API_KEY=\"sk-clco-...\"\n$ claude --version"],
  ["4", "사용량 확인", "$ curl https://api.clcocloud.kr/v1/usage"]
];

export function Sequence08Flow() {
  return (
    <section id="flow" className="cc-section bg-[var(--surface-dark-2)] py-[var(--section-y)] text-[var(--cream)]">
      <div className="pointer-events-none absolute -right-[6%] bottom-[-12%] z-0 font-mono text-[clamp(200px,26vw,360px)] leading-none text-transparent [-webkit-text-stroke:1px_rgba(217,119,87,0.10)]">04</div>
      <div className="cc-max relative z-[1] grid gap-12 lg:grid-cols-[0.38fr_0.62fr]">
        <div className="top-20 h-fit lg:sticky">
          <p className="cc-eyebrow before:hidden">4 Steps</p>
          <h2 aria-label="결제 후, 공식 클로드코드에 연결하면 끝." className="cc-display mt-5 text-[calc(var(--fs-display)*0.95)] text-[var(--cream)]">
            <span className="block"><CCSplitText text="결제 후, 공식" delay={0.02} /></span>
            <span className="block"><CCSplitText text="클로드코드에" delay={0.02} /></span>
            <span className="block cc-serif text-[calc(var(--fs-display)*0.9)] text-[var(--coral)]">연결하면 끝.</span>
          </h2>
          <CCAnimatedContent className="mt-8 hidden rounded-[var(--r-md)] border border-[var(--line-dark)] bg-[rgba(247,241,232,0.04)] p-5 font-mono text-[var(--fs-caption)] leading-[1.75] text-[rgba(247,241,232,0.78)] shadow-[var(--shadow-dark)] backdrop-blur lg:block" distance={20} duration={0.7}>
            <div className="mb-4 flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--coral)]" />
              <span className="h-2 w-2 rounded-full bg-[rgba(247,241,232,0.50)]" />
              <span className="h-2 w-2 rounded-full bg-[rgba(247,241,232,0.25)]" />
            </div>
            <p><span className="text-[rgba(247,241,232,0.40)]">$</span> key issued: <span className="font-semibold text-[var(--coral)]">sk-clco-xxxx-xxxx-xxxx</span></p>
            <p><span className="text-[rgba(247,241,232,0.40)]">$</span> export <span className="text-[var(--coral-soft)]">ANTHROPIC_API_KEY</span>=<span className="text-[rgba(247,241,232,0.85)]">&quot;sk-clco-...&quot;</span></p>
            <p><span className="text-[rgba(247,241,232,0.40)]">$</span> <span className="text-[rgba(247,241,232,0.92)]">claude --version</span></p>
          </CCAnimatedContent>
        </div>
        <CCAnimatedContent className="grid gap-5" distance={24} duration={0.7}>
          {steps.map(([number, title, code], index) => (
            <motion.article
              key={number}
              className="group relative overflow-visible rounded-[var(--r-lg)] border border-[var(--line-dark)] bg-[rgba(247,241,232,0.04)] p-7 shadow-[var(--shadow-dark)] backdrop-blur transition duration-200 ease-[var(--ease-out)] hover:-translate-y-1 hover:border-[rgba(217,119,87,0.40)] hover:bg-[rgba(247,241,232,0.06)] hover:shadow-[0_24px_60px_-24px_rgba(217,119,87,0.25),var(--shadow-dark)]"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              {index < steps.length - 1 ? <span className="pointer-events-none absolute left-7 top-full hidden h-5 border-l border-dashed border-[rgba(247,241,232,0.20)] lg:block [animation:cc-dash-reveal_1.2s_var(--ease-out)_forwards]" /> : null}
              <motion.span
                className="absolute left-7 top-[-14px] grid h-8 w-8 place-items-center rounded-full bg-[var(--coral)] text-[var(--fs-caption)] font-bold text-[var(--cream)] shadow-[0_8px_20px_rgba(217,119,87,0.40)]"
                initial={{ scale: 0.6 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.26, delay: index * 0.1 + 0.15, ease: [0.34, 1.56, 0.64, 1] }}
              >
                {number}
              </motion.span>
              <span className="pointer-events-none absolute right-6 top-4 font-mono text-[calc(var(--fs-display)*0.9)] font-medium leading-none text-transparent [-webkit-text-stroke:1px_rgba(247,241,232,0.20)] transition duration-200 group-hover:[-webkit-text-stroke-color:rgba(247,241,232,0.45)]">
                <CCSplitText text={number.padStart(2, "0")} charsOnly delay={0.05} />
              </span>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[rgba(247,241,232,0.20)]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[rgba(247,241,232,0.20)]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[rgba(247,241,232,0.20)]" />
                <button type="button" className="ml-auto rounded-full border border-[var(--line-dark)] bg-[rgba(217,119,87,0.12)] px-3 py-1 text-xs font-semibold text-[var(--coral)] opacity-0 transition duration-200 group-hover:opacity-100">복사</button>
              </div>
              <div className="relative z-[1] mt-6">
                <h3 className="text-[var(--fs-h3)] font-semibold tracking-[-0.015em] text-[var(--cream)]">{title}</h3>
                <pre className="mt-5 overflow-auto rounded-[var(--r-md)] border border-[rgba(247,241,232,0.06)] bg-[rgba(0,0,0,0.36)] p-4 font-mono text-[var(--fs-caption)] leading-[1.7] text-[rgba(247,241,232,0.68)]">
                  <code className="text-code">{insertWordBreaks(code)}</code>
                </pre>
              </div>
            </motion.article>
          ))}
        </CCAnimatedContent>
      </div>
    </section>
  );
}
