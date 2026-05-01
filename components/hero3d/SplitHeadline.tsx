"use client";

import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { motion, type MotionValue } from "framer-motion";
import { useEffect, useRef } from "react";
import { reducedMotionEnabled } from "@/lib/hero3d/animations";

gsap.registerPlugin(SplitText);

export function SplitHeadline({
  y,
  opacity,
  blur,
  letterSpacing,
  parallaxX,
  parallaxY
}: {
  y: MotionValue<number>;
  opacity: MotionValue<number>;
  blur: MotionValue<string>;
  letterSpacing: MotionValue<string>;
  parallaxX: MotionValue<number>;
  parallaxY: MotionValue<number>;
}) {
  const rootRef = useRef<HTMLHeadingElement | null>(null);
  const underlineRef = useRef<HTMLSpanElement | null>(null);
  const dotRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = reducedMotionEnabled();
    const split = new SplitText(root.querySelectorAll("[data-split-line]"), {
      type: "words,chars",
      charsClass: "hero3d-char",
      wordsClass: "hero3d-word",
      aria: "hidden"
    });

    if (reduce) {
      gsap.set(split.chars, { opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" });
      gsap.set(underlineRef.current, { clipPath: "inset(0% 0% 0% 0%)" });
      return () => split.revert();
    }

    gsap.set(split.chars, {
      opacity: 0,
      y: 22,
      rotateX: -18,
      filter: "blur(6px)",
      transformOrigin: "50% 100%"
    });
    gsap.set(underlineRef.current, { clipPath: "inset(0% 100% 0% 0%)" });
    gsap.set(dotRef.current, { scale: 0, transformOrigin: "50% 50%" });

    const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
    timeline.to(split.chars, {
      opacity: 1,
      y: 0,
      rotateX: 0,
      filter: "blur(0px)",
      duration: 0.38,
      stagger: 0.008,
      delay: 0.04
    });
    timeline.to(underlineRef.current, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.34, ease: "expo.out" }, 0.32);
    timeline.to(dotRef.current, { scale: 1.18, duration: 0.1, ease: "back.out(2)" }, 0.42);
    timeline.to(dotRef.current, { scale: 1, duration: 0.1, ease: "power2.out" }, 0.54);

    return () => {
      timeline.kill();
      split.revert();
    };
  }, []);

  return (
    <motion.h1
      ref={rootRef}
      style={{ y, opacity, filter: blur, letterSpacing, x: parallaxX, translateY: parallaxY }}
      className="hero3d-split-headline max-w-[790px] text-left text-[clamp(34px,10.4vw,48px)] font-bold leading-[1.015] tracking-[-0.047em] text-primary sm:text-[clamp(46px,7.05vw,76px)] md:text-[clamp(62px,6.05vw,96px)]"
      aria-label="언제 끊길지 모르는 불안한 구독계정, 이제는 클코클라우드."
    >
      <span data-split-line className="block whitespace-nowrap">언제 끊길지 모르는</span>
      <span data-split-line className="block">
        <span data-emphasis className="font-serif text-[1.04em] font-medium italic tracking-[-0.045em]">불안한</span> 구독계정,
      </span>
      <span data-split-line className="block whitespace-nowrap">
        <span className="mr-[0.14em] inline-block text-primary">이제는</span>
        <span className="hero3d-coral-word relative inline-block text-coral">
          클코클라우드
          <span ref={underlineRef} className="hero3d-coral-underline" aria-hidden="true" />
        </span>
        <span ref={dotRef} className="inline-block text-coral">.</span>
      </span>
    </motion.h1>
  );
}
