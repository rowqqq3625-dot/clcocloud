"use client";

import { CodeBlockFloat } from "@/components/system/CodeBlockFloat";
import { RevealText } from "@/components/typography/RevealText";
import { SplitHeading } from "@/components/typography/SplitHeading";
import { insertWordBreaks } from "@/lib/text-utils";

const steps = [
  ["1", "잔액 플랜 선택", "# ₩98,000 / ₩196,000 / ₩264,000"],
  ["2", "API 키 발급", "$ key issued: sk-clco-xxxx-xxxx-xxxx"],
  ["3", "공식 클로드코드에 연결", "$ export ANTHROPIC_API_KEY=\"sk-clco-...\"\n$ claude --version"],
  ["4", "사용량 확인", "$ curl https://api.clcocloud.kr/v1/usage"]
];

export function Sequence08Flow() {
  return (
    <section id="flow" className="bg-cream py-32">
      <div className="container-cinematic grid gap-12 lg:grid-cols-[.42fr_.58fr]">
        <div className="top-24 h-fit lg:sticky">
          <p className="eyebrow">4 Steps</p>
          <SplitHeading
            as="h2"
            aria-label="결제 후, 공식 클로드코드에 연결하면 끝."
            className="section-display mt-5 text-[clamp(44px,5vw,76px)] font-semibold"
            lines={[
              "결제 후, 공식 클로드코드에",
              <span key="flow-emphasis" className="whitespace-nowrap serif-italic text-coral">연결하면 끝.</span>
            ]}
          />
          <div className="mt-8 hidden lg:block">
            <CodeBlockFloat
              lines={[
                "$ key issued: sk-clco-xxxx-xxxx-xxxx",
                '$ export ANTHROPIC_API_KEY="sk-clco-..."',
                "$ claude --version"
              ]}
            />
          </div>
        </div>
        <div className="grid gap-5">
          {steps.map(([number, title, code]) => (
            <article key={number} className="group relative overflow-visible rounded-[14px] border border-[var(--border-dark)] bg-dark shadow-[inset_0_1px_rgba(255,255,255,.04),0_24px_64px_rgba(31,30,29,.12)] transition duration-300 hover:-translate-y-1">
              <span className="absolute -left-3 -top-3 grid h-8 w-8 place-items-center rounded-full bg-coral text-sm font-semibold text-cream transition duration-500 group-hover:rotate-0 group-hover:scale-110">{number}</span>
              <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
                <span className="h-3 w-3 rounded-full bg-[#3A3735] transition-colors duration-300 group-hover:bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#2D2A28] transition-colors duration-300 group-hover:bg-[#ffbd2e]" />
                <span className="h-3 w-3 rounded-full bg-[#3A3735] transition-colors duration-300 group-hover:bg-[#28c840]" />
                <button type="button" className="ml-auto rounded-full bg-coral/12 px-3 py-1 text-xs font-semibold text-coral opacity-0 transition duration-200 group-hover:opacity-100">복사</button>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-cream">{title}</h3>
                <pre className="mt-5 overflow-auto rounded-2xl bg-black/30 p-5 font-mono text-sm leading-7 text-cream/82">
                  <code className="text-code">{insertWordBreaks(code)}</code>
                </pre>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
