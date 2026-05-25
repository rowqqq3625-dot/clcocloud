"use client";

import { motion, type MotionValue } from "framer-motion";

const charVariants = {
  hidden: {
    opacity: 0,
    y: 22,
    rotateX: -18,
    filter: "blur(6px)",
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.38,
      ease: [0.25, 1, 0.5, 1],
      delay: i * 0.008 + 0.04,
    }
  })
};

const underlineVariants = {
  hidden: { clipPath: "inset(0% 100% 0% 0%)" },
  visible: {
    clipPath: "inset(0% 0% 0% 0%)",
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
      delay: 24 * 0.008 + 0.08,
    }
  }
};

const dotVariants = {
  hidden: { scale: 0 },
  visible: {
    scale: [0, 1.18, 1],
    transition: {
      duration: 0.22,
      times: [0, 0.45, 1],
      ease: "easeOut",
      delay: 36 * 0.008 + 0.12,
    }
  }
};

function AnimatedChars({ 
  text, 
  startIndex, 
  className = "" 
}: { 
  text: string; 
  startIndex: number; 
  className?: string; 
}) {
  const parts = text.split(/(\s+)/);
  let charAccumulator = 0;

  return (
    <span className={className}>
      {parts.map((part, partIndex) => {
        if (part === "") return null;

        const isSpace = /^\s+$/.test(part);
        if (isSpace) {
          return [...part].map((char, charIdx) => {
            const charIndex = startIndex + charAccumulator;
            charAccumulator += 1;
            return (
              <motion.span
                key={`space-${partIndex}-${charIdx}`}
                custom={charIndex}
                variants={charVariants}
                initial="hidden"
                animate="visible"
                className="inline-block origin-[50%_100%] whitespace-pre"
              >
                {"\u00A0"}
              </motion.span>
            );
          });
        } else {
          return (
            <span key={`word-${partIndex}`} className="inline-block whitespace-nowrap">
              {[...part].map((char, charIdx) => {
                const charIndex = startIndex + charAccumulator;
                charAccumulator += 1;
                return (
                  <motion.span
                    key={charIdx}
                    custom={charIndex}
                    variants={charVariants}
                    initial="hidden"
                    animate="visible"
                    className="inline-block origin-[50%_100%] whitespace-pre"
                  >
                    {char}
                  </motion.span>
                );
              })}
            </span>
          );
        }
      })}
    </span>
  );
}

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
  return (
    <motion.div
      style={{ y, opacity, filter: blur, letterSpacing, x: parallaxX, translateY: parallaxY }}
      className="hero3d-split-headline max-w-[920px] text-left"
    >
      <motion.h2
        className="text-[32px] sm:text-[43px] md:text-[50px] lg:text-[64px] xl:text-[73px] 2xl:text-[80px] font-bold leading-[1.12] tracking-[-0.047em] text-primary break-keep"
        aria-label="클코클라우드 - 생각은 가볍게, 빌드는 완벽하게"
      >
        <span className="block">
          {/* Line 1: 언제 끊길지 모르는 불안한 구독 계정, */}
          <span className="block">
            <AnimatedChars text="언제 끊길지 모르는 불안한 구독 계정," startIndex={0} />
          </span>

          {/* Line 2: 이제는 클코클라우드. */}
          <span className="block">
            <AnimatedChars text="이제는 " startIndex={21} className="inline-block text-primary" />
            <span className="font-serif text-[1.04em] font-medium italic tracking-[-0.045em] hero3d-coral-word relative inline-block text-coral">
              <AnimatedChars text="클코클라우드" startIndex={25} />
              <motion.span
                variants={underlineVariants}
                initial="hidden"
                animate="visible"
                className="hero3d-coral-underline"
                aria-hidden="true"
              />
            </span>
            <motion.span
              variants={dotVariants}
              initial="hidden"
              animate="visible"
              className="inline-block text-coral"
            >
              .
            </motion.span>
          </span>
        </span>
      </motion.h2>
      <p className="mt-4 text-[15px] sm:text-[17px] leading-relaxed text-primary/60 max-w-[600px]">
        가격 부담으로 망설여졌던 바이브코딩, 이제 멈추지않는 혁신을 만나보세요.
      </p>
    </motion.div>
  );
}
