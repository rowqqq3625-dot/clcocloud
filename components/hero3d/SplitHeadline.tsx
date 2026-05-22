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
      duration: 0.34,
      ease: [0.16, 1, 0.3, 1],
      delay: 28 * 0.008 + 0.08,
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
      delay: 29 * 0.008 + 0.12,
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
  return (
    <span className={className}>
      {[...text].map((char, index) => {
        const charIndex = startIndex + index;
        return (
          <motion.span
            key={index}
            custom={charIndex}
            variants={charVariants}
            initial="hidden"
            animate="visible"
            className="inline-block origin-[50%_100%] whitespace-pre"
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        );
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
    <motion.h1
      style={{ y, opacity, filter: blur, letterSpacing, x: parallaxX, translateY: parallaxY }}
      className="hero3d-split-headline max-w-[790px] text-left text-[clamp(34px,10.4vw,48px)] font-bold leading-[1.015] tracking-[-0.047em] text-primary sm:text-[clamp(46px,7.05vw,76px)] md:text-[clamp(62px,6.05vw,96px)]"
      aria-label="언제 끊길지 모르는 불안한 구독계정, 이제는 클코클라우드."
    >
      <span className="block">
        {/* Line 1 */}
        <span className="block whitespace-nowrap">
          <AnimatedChars text="언제 끊길지 모르는" startIndex={0} />
        </span>

        {/* Line 2 */}
        <span className="block">
          <span data-emphasis className="font-serif text-[1.04em] font-medium italic tracking-[-0.045em]">
            <AnimatedChars text="불안한" startIndex={10} />
          </span>
          <AnimatedChars text=" 구독계정," startIndex={13} />
        </span>

        {/* Line 3 */}
        <span className="block whitespace-nowrap">
          <AnimatedChars text="이제는 " startIndex={19} className="inline-block text-primary" />
          <span className="hero3d-coral-word relative inline-block text-coral">
            <AnimatedChars text="클코클라우드" startIndex={23} />
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
    </motion.h1>
  );
}
