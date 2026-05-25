"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CCAnimatedContent } from "@/components/reactbits-wrapped/CCAnimatedContent";

interface FirstStepLeftTextProps {
  reducedMotion: boolean;
}

function FirstStepLeftText({ reducedMotion }: FirstStepLeftTextProps) {
  const speed = (delay: number, duration: number) => {
    return reducedMotion
      ? { delay: 0, duration: 0 }
      : { delay, duration, ease: [0.22, 1, 0.36, 1] };
  };

  return (
    <div className="relative z-10 w-full flex flex-col items-start select-none py-6 lg:py-0 max-w-[380px] min-[1140px]:max-w-[460px] xl:max-w-[540px]">
      {/* Relative container holding both vertical bar and headline together */}
      <div className="relative flex items-stretch gap-[20px] w-full">
        {/* 1.5px Coral Vertical Bar */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={speed(0, 0.32)}
          className="w-[1.5px] bg-[#D97757] self-stretch origin-top shrink-0"
        />

        {/* Headline 2 lines with 7% 추가 scaled-up premium responsive typography */}
        <h2 
          className="text-[32px] md:text-[38px] lg:text-[38px] min-[1140px]:text-[45px] xl:text-[51px] 2xl:text-[56px] leading-[1.18] tracking-[-0.035em] text-[#F7F1E8] w-full"
          style={{ 
            fontFamily: "'Outfit', 'Inter', 'Pretendard Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", 
            fontWeight: 680 
          }}
        >
          {/* 1st Line */}
          <span className="block overflow-hidden whitespace-nowrap">
            <motion.span
              className="block"
              initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={speed(0, 0.32)}
            >
              망설였던 아이디어
            </motion.span>
          </span>

          {/* 2nd Line */}
          <span className="block overflow-hidden whitespace-nowrap mt-0.5 md:mt-1">
            <motion.span
              className="block"
              initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={speed(0.08, 0.32)}
            >
              부담없이{" "}
              {/* Highlight word: 펄쳐보세요 (Serif Italic) */}
              <motion.span
                initial={reducedMotion ? { color: "#D97757" } : { color: "#F7F1E8" }}
                animate={{ color: "#D97757" }}
                transition={speed(0.18, 0.24)}
                className="font-serif inline-block relative"
                style={{ 
                  fontFamily: "'Playfair Display', 'Newsreader', 'Didot', 'Georgia', serif", 
                  fontWeight: 500,
                  fontStyle: "italic" 
                }}
              >
                펄쳐보세요
                {/* Coral Underline: 1px, baseline offset 6px, exact matching width */}
                <motion.span
                  initial={reducedMotion ? { width: "100%" } : { width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={speed(0.18, 0.38)}
                  className="absolute left-0 bottom-[-6px] h-[1px] bg-[#D97757]"
                />
              </motion.span>
              .
            </motion.span>
          </span>
        </h2>
      </div>

      {/* Sub Copy: 28px below 2nd line baseline, aligned with vertical bar X axis (Mono Typeface) */}
      <motion.div
        initial={reducedMotion ? { opacity: 0.5 } : { opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={speed(0.56, 0.24)}
        className="mt-[28px] text-[11px] xl:text-[12px] tracking-[0.04em] text-[#F7F1E8]"
        style={{ 
          fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Courier New', monospace", 
          fontWeight: 420 
        }}
      >
        부담은 줄이고, 가능성은 그대로.
      </motion.div>
    </div>
  );
}

export function StickyDashboard() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  return (
    <section 
      className="cc-section relative min-h-0 bg-[#0B0A09] text-[var(--cream)] py-16 sm:py-24 lg:py-32 overflow-hidden"
    >
      {/* Background mesh: Hidden for flat warm black aesthetic */}
      <div 
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(247,241,232,0.04)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:linear-gradient(90deg,transparent_0%,black_30%,black_70%,transparent_100%)] opacity-0 transition-opacity duration-500" 
      />
      
      {/* Dynamic 44:56 layout with Left-Flush gutters and order stacking */}
      <div className="mx-auto max-w-7xl px-[24px] md:px-10 lg:pl-[44px] lg:pr-8 xl:pl-[56px] xl:pr-16">
        <div className="grid items-center gap-6 lg:gap-12 xl:gap-20 lg:grid-cols-[0.44fr_0.56fr]">
          {/* Left Text Block: order-2 (stacked below on tablet/mobile) */}
          <div className="w-full flex justify-start order-2 lg:order-1">
            <FirstStepLeftText reducedMotion={reducedMotion} />
          </div>
          {/* Right Video Container: order-1 (stacked above on tablet/mobile) */}
          <div className="w-full order-1 lg:order-2">
            <CCAnimatedContent distance={30} duration={0.8} threshold={0.15}>
              <DashboardPanel reducedMotion={reducedMotion} />
            </CCAnimatedContent>
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardPanel({ reducedMotion }: { reducedMotion: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // IntersectionObserver to auto play/pause video depending on viewport visibility
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch((err) => {
            console.warn("Autoplay was prevented by browser policies:", err);
          });
        } else {
          video.pause();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(video);
    return () => observer.unobserve(video);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-4xl bg-transparent border-transparent shadow-none p-0 min-h-0 flex flex-col justify-center transition-all duration-500">
      <div className="relative z-10 w-full overflow-hidden rounded-[16px] md:rounded-[22px] lg:rounded-[28px] bg-black/90 p-1 border border-white/[0.06] shadow-[inset_0_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-500">
        {/* Elegant Inner Glass Outline */}
        <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-white/[0.05] z-10" />

        {/* Video Frame wrapper to force rounded corners */}
        <div className="relative overflow-hidden rounded-[12px] md:rounded-[18px] lg:rounded-[24px] bg-black/90 aspect-video">
          <video
            ref={videoRef}
            src="/videos/fcc6f7fcb17b434e9c89570ee009ad8a.mp4"
            className="w-full h-full block object-cover pointer-events-none scale-[1.002] transform-gpu will-change-transform"
            loop
            muted
            playsInline
            preload="metadata"
            controls={false}
            disablePictureInPicture
            disableRemotePlayback
            controlsList="nodownload nofullscreen noremoteplayback"
            onContextMenu={(e) => e.preventDefault()}
          />

          {/* Coral Dot synchronized fade-in at 1040ms */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reducedMotion ? 0 : 1.04, duration: 0.35 }}
            className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-[#D97757] shadow-[0_0_8px_#D97757] z-30 animate-pulse"
          />
        </div>
      </div>
    </div>
  );
}
