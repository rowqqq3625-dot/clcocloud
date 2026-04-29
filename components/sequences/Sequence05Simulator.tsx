import { SliderInteractive } from "@/components/ui/SliderInteractive";
import { RevealText } from "@/components/typography/RevealText";
import { SplitHeading } from "@/components/typography/SplitHeading";
import { pricingPlansWithDiscount } from "@/lib/pricing";

const plans = pricingPlansWithDiscount.map((plan) => ({
  label: plan.label,
  tokens: plan.tokens,
  hours: plan.hours,
  discount: plan.discount
}));

export function Sequence05Simulator() {
  return (
    <section id="calculator" className="bg-cream-2 py-32">
      <div className="container-cinematic grid gap-10 rounded-[32px] border border-[var(--border-subtle)] bg-cream p-6 shadow-lg lg:grid-cols-[.45fr_.55fr] lg:p-12">
        <div>
          <p className="eyebrow">Calculate</p>
          <SplitHeading
            as="h2"
            className="section-display mt-5 max-w-xl text-[clamp(40px,5vw,72px)] font-semibold"
            lines={["내 사용량 기준, 어느 플랜이 맞을지 먼저 계산하세요."]}
          />
          <RevealText className="mt-6 max-w-md text-lg leading-8 text-secondary">
            충전 금액을 움직이면 예상 사용량과 절감률을 바로 확인합니다.
          </RevealText>
        </div>
        <SliderInteractive plans={plans} />
      </div>
    </section>
  );
}
