"use client";

import { CCAnimatedContent } from "@/components/reactbits-wrapped/CCAnimatedContent";
import { CCSplitText } from "@/components/reactbits-wrapped/CCSplitText";

export function Sequence07PhotoBreak() {
  return (
    <section className="cc-section grid min-h-[80vh] place-items-center bg-[var(--surface-dark)] py-[var(--section-y-tight)] text-[var(--cream)]">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,var(--surface-dark-2))]" />
      <CCAnimatedContent className="pointer-events-none absolute -right-[8%] bottom-[-16%] z-0 font-sans text-[clamp(160px,22vw,280px)] font-semibold leading-none text-transparent [-webkit-text-stroke:1px_rgba(247,241,232,0.08)]" opacityOnly delay={0.4} duration={1.2}>
        WORKFLOW
      </CCAnimatedContent>
      <div className="cc-max relative z-[1]">
        <p className="cc-eyebrow">Why 4 Steps</p>
        <h2 className="cc-display mt-6 max-w-[880px] text-[var(--cream)]">
          <span className="block"><CCSplitText text="한 사람의 작업" delay={0.02} /></span>
          <span className="block"><span className="cc-serif">흐름을 끊지 않는</span></span>
          <span className="block"><CCSplitText text="것이 " delay={0.02} /><span className="text-[var(--coral)]">우선</span><span>입니다</span><span className="text-[var(--coral)]">.</span></span>
        </h2>
        <p className="mt-6 text-xl leading-[var(--lh-body)] text-[rgba(247,241,232,0.70)]">공유계정도, 일일 제한도 없이.</p>
      </div>
    </section>
  );
}
