import { SliderInteractive } from "@/components/ui/SliderInteractive";
import { CCAnimatedContent } from "@/components/reactbits-wrapped/CCAnimatedContent";
import { CCSplitText } from "@/components/reactbits-wrapped/CCSplitText";
import { pricingPlansWithDiscount } from "@/lib/pricing";

const plans = pricingPlansWithDiscount.map((plan) => ({
  label: plan.label,
  tokens: plan.tokens,
  hours: plan.hours,
  discount: plan.discount
}));

export function Sequence05Simulator() {
  return (
    <section id="calculator" className="cc-section bg-[var(--cream)] py-[var(--section-y-tight)]">
      <CCAnimatedContent className="cc-max relative grid gap-16 rounded-[var(--r-2xl)] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(251,246,236,1)_0%,var(--cream)_100%)] p-8 shadow-[var(--shadow-lg)] lg:grid-cols-[0.5fr_0.5fr] lg:gap-24 lg:p-14" distance={24} duration={0.7}>
        <span className="pointer-events-none absolute right-6 top-6 h-6 w-6 rounded-full border border-[var(--coral)] opacity-40" />
        <div className="relative z-[1] lg:translate-x-[4%] lg:pr-0">
          <p className="cc-eyebrow before:hidden">Calculate</p>
          <h2 
            className="cc-display mt-5 max-w-xl leading-[1.2] tracking-tight text-[var(--ink)]"
            style={{ fontSize: "clamp(32px, 5.1vw, 64px)" }}
          >
            <span 
              className="block whitespace-nowrap font-serif italic font-medium tracking-tight text-[var(--coral,#ff7f50)] pr-2 py-0.5" 
              style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic" }}
            >
              <CCSplitText text="내 사용량 기준," delay={0.02} />
            </span>
            <span className="block whitespace-nowrap"><CCSplitText text="어느 플랜이 맞을지" delay={0.02} /></span>
            <span className="block whitespace-nowrap"><CCSplitText text="먼저 계산하세요" delay={0.02} /><span className="text-[var(--coral)]">.</span></span>
          </h2>
          <p className="mt-8 max-w-[460px] text-[21px] leading-[1.6] tracking-[-0.020em] text-[var(--ink-soft)] font-medium">
            충전 금액을 움직이면,<br />
            예상 사용량과 절감률을 바로 확인합니다.
          </p>
        </div>
        <SliderInteractive plans={plans} />
      </CCAnimatedContent>
    </section>
  );
}
