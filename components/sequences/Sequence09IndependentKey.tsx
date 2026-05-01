import { CountUp } from "@/components/ui/CountUp";
import { SplitHeading } from "@/components/typography/SplitHeading";

export function Sequence09IndependentKey() {
  return (
    <section className="cinematic-section grid place-items-center bg-cream px-5 py-32">
      <div className="container-cinematic text-center">
        <p className="eyebrow">Independent Key</p>
        <SplitHeading
          as="h2"
          aria-label="구독계정이 아닌, 나만의 API 키."
          className="section-display mx-auto mt-6 max-w-5xl text-[clamp(48px,7vw,104px)] font-semibold"
          lines={["구독계정이 아닌,", <span key="independent-emphasis" className="whitespace-nowrap serif-italic text-coral">나만의 API 키.</span>]}
        />
        <div className="mt-20 grid gap-10 md:grid-cols-3">
          <Stat value={100} suffix="%" label="안정성" />
          <Stat value={26} suffix="명" label="이용고객" />
          <Stat value={100} suffix="%" label="재구매율" />
        </div>
      </div>
    </section>
  );
}

function Stat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  return (
    <div className="relative border-coral/30 md:border-r md:last:border-r-0">
      <strong className="text-[clamp(64px,10vw,140px)] font-semibold leading-none tracking-[-.06em]">
        <CountUp end={value} suffix={suffix} />
      </strong>
      <p className="mt-4 text-lg font-semibold text-secondary">{label}</p>
    </div>
  );
}
