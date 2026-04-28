"use client";

import { CodeBlockFloat } from "@/components/system/CodeBlockFloat";
import { ImageReveal } from "@/components/ui/ImageReveal";
import { RevealText } from "@/components/typography/RevealText";
import { SplitHeading } from "@/components/typography/SplitHeading";

export function Sequence07PhotoBreak() {
  return (
    <section className="relative h-[80vh] overflow-hidden bg-dark">
      <ImageReveal
        src="/images/workspace-dark.avif"
        alt="따뜻한 모니터 빛과 코드 화면이 보이는 어두운 개발자 작업 공간"
        fill
        sizes="100vw"
        imageClassName="animate-image-drift object-cover opacity-78 will-change-transform"
        priority={false}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.55),transparent_60%),linear-gradient(180deg,rgba(15,14,13,.12),rgba(15,14,13,.72))]" />
      <div className="absolute inset-0 animate-coral-wash bg-coral/0" />
      <div className="absolute right-10 top-10 hidden w-72 lg:block">
        <CodeBlockFloat
          lines={[
            '$ export ANTHROPIC_API_KEY="sk-clco-..."',
            "$ claude --version",
            "$ curl https://api.clcocloud.kr/v1/usage"
          ]}
        />
      </div>
      <div className="container-cinematic absolute inset-x-0 bottom-16 max-w-[720px]">
        <SplitHeading
          as="h2"
          className="section-display max-w-4xl text-[clamp(40px,6vw,86px)] font-semibold text-cream"
          lines={["한 사람의 작업 흐름을 끊지 않는 것이 우선입니다."]}
        />
        <RevealText className="mt-6 text-xl text-cream/70">공유계정도, 일일 제한도 없이.</RevealText>
      </div>
      <div className="section-transition-mask bg-[linear-gradient(180deg,transparent,var(--bg-cream))]" />
    </section>
  );
}
