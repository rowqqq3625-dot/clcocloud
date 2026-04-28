"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AbstractChart } from "@/components/system/AbstractChart";
import { CountUp } from "@/components/ui/CountUp";
import { GrainOverlay } from "@/components/system/GrainOverlay";
import { maxDiscount } from "@/lib/pricing";

const panels = [
  {
    title: "Anthropic 공식 API",
    value: 100,
    suffix: "%",
    caption: "정가 그대로",
    detail: "사용량이 올라가면 비용도 그대로 올라갑니다."
  },
  {
    title: "공유 구독 플랫폼",
    value: 0,
    suffix: " privacy",
    caption: "공유 풀",
    detail: "동시 사용, 설정 충돌, 프라이버시 리스크가 남습니다."
  },
  {
    title: "클코클라우드",
    value: maxDiscount,
    suffix: "%",
    caption: "절감",
    detail: "개인 전용 키와 잔액형 구조로 필요한 만큼만 사용합니다."
  }
];

export function HorizontalCompare() {
  const rootRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || window.innerWidth < 1024) return;

    gsap.registerPlugin(ScrollTrigger);
    const tween = gsap.to(track, {
      xPercent: -66.666,
      ease: "none",
      scrollTrigger: {
        trigger: root,
        pin: true,
        scrub: 1,
        end: "+=2200",
        onUpdate: (self) => setActive(Math.min(2, Math.round(self.progress * 2)))
      }
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <section ref={rootRef} className="relative overflow-hidden bg-[linear-gradient(180deg,var(--bg-cream),var(--bg-cream-2))] py-24 lg:h-screen lg:py-0">
      <GrainOverlay className="hidden lg:block [background:linear-gradient(180deg,transparent,var(--bg-cream-2))]" glowPosition="center-right" />
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-20 bg-gradient-to-r from-cream to-transparent lg:block" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-20 bg-gradient-to-l from-cream-2 to-transparent lg:block" />
      <div ref={trackRef} className="flex flex-col gap-5 px-5 lg:h-screen lg:w-[300vw] lg:flex-row lg:items-center lg:gap-[3vw] lg:px-[10vw]">
        {panels.map((panel, index) => (
          <article
            key={panel.title}
            className={`min-h-[66vh] min-w-0 rounded-[36px] p-8 transition duration-500 lg:flex lg:w-[72vw] lg:shrink-0 lg:items-end lg:justify-between lg:gap-12 lg:p-14 xl:w-[68vw] 2xl:w-[64vw] ${
              index === 2
                ? "bg-[radial-gradient(circle_at_88%_12%,rgba(245,239,230,.18),transparent_34%),linear-gradient(135deg,var(--coral-hi),var(--coral),var(--coral-lo))] text-cream shadow-coral"
                : "border border-[var(--border-subtle)] bg-cream/70 text-primary"
            } ${active === index ? "scale-100 opacity-100" : "lg:scale-[.96] lg:opacity-70"}`}
          >
            <div className="min-w-0 lg:max-w-[56%]">
              <p className={index === 2 ? "flex items-center gap-3 text-cream/80" : "eyebrow"}>
                {index === 2 ? <span className="h-6 w-1 bg-cream" /> : null}
                {panel.title}
              </p>
              <strong className="mt-8 block max-w-[8ch] break-keep text-[clamp(72px,14vw,180px)] font-semibold leading-[0.9] tracking-[-.06em] [text-shadow:0_1px_1px_rgba(0,0,0,.18)]">
                <CountUp end={panel.value} suffix={panel.suffix} duration={1200} />
              </strong>
              <p className="mt-4 text-2xl font-semibold">{panel.caption}</p>
            </div>
            <div className="mt-8 min-w-0 max-w-sm lg:mt-0 lg:w-[32%] lg:min-w-[260px]">
              <p className={`text-lg leading-8 break-keep ${index === 2 ? "text-cream/82" : "text-secondary"}`}>{panel.detail}</p>
              <AbstractChart className={`mt-10 h-24 w-full ${index === 2 ? "text-cream" : ""}`} />
            </div>
          </article>
        ))}
      </div>
      <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 gap-2 lg:flex">
        {panels.map((panel, index) => (
          <span key={panel.title} className={`h-2 rounded-full transition-all duration-300 ${active === index ? "w-6 bg-coral" : "w-2 bg-primary/20"}`} />
        ))}
      </div>
    </section>
  );
}
