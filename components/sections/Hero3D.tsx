"use client";

import { motion, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { HeroBackground } from "@/components/hero3d/HeroBackground";
import { HeroCTAGroup } from "@/components/hero3d/HeroCTAGroup";
import MascotCanvas from "@/components/hero3d/MascotCanvas";
import { SplitHeadline } from "@/components/hero3d/SplitHeadline";
import { WatermarkText } from "@/components/hero3d/WatermarkText";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { mascotToastMessages } from "@/lib/hero3d/animations";
import { useMouseRef } from "@/lib/hero3d/use-mouse";

export function Hero3D() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: stageRef, offset: ["start start", "end start"] });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [burstId, setBurstId] = useState(0);
  const mouseRef = useMouseRef(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const parallaxX = useSpring(useTransform(mouseX, [-1, 1], [-6, 6]), { stiffness: 80, damping: 22, mass: 0.4 });
  const parallaxY = useSpring(useTransform(mouseY, [-1, 1], [4, -4]), { stiffness: 80, damping: 22, mass: 0.4 });
  const watermarkX = useSpring(useTransform(mouseX, [-1, 1], [-6, 6]), { stiffness: 70, damping: 24, mass: 0.45 });

  const headlineY = useTransform(scrollYProgress, [0, 0.3], [0, -40]);
  const headlineOpacity = useTransform(scrollYProgress, [0, 0.24, 0.3], [1, 1, 0]);
  const headlineBlur = useTransform(scrollYProgress, [0, 0.3], ["blur(0px)", "blur(8px)"]);
  const headlineSpacing = useTransform(scrollYProgress, [0, 0.3], ["-0.025em", "-0.045em"]);
  const watermarkOpacity = useTransform(scrollYProgress, [0, 0.4], [0.068, 0]);
  const watermarkSpacing = useTransform(scrollYProgress, [0, 0.4], ["-0.05em", "-0.08em"]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setScrollProgress(Math.min(Math.max(latest, 0), 1));
  });

  const triggerMascot = () => {
    const nextMessage = mascotToastMessages[Math.floor(Math.random() * mascotToastMessages.length)];
    setToastMessage(nextMessage);
    setBurstId(Date.now());
    window.setTimeout(() => setToastMessage(null), 2000);
  };

  return (
    <section
      id="top"
      className="hero3d-root relative min-h-[100svh] overflow-hidden bg-cream px-3 pt-8 text-primary sm:px-6 lg:min-h-[108vh]"
      onPointerMove={(event) => {
        mouseX.set((event.clientX / window.innerWidth) * 2 - 1);
        mouseY.set(-((event.clientY / window.innerHeight) * 2 - 1));
      }}
      onPointerLeave={() => {
        mouseX.set(0);
        mouseY.set(0);
      }}
    >
      <HeroBackground />
      <SiteHeader variant="floating" />

      <div
        ref={stageRef}
        className="relative z-10 mx-auto mt-5 min-h-[calc(100svh-126px)] max-w-[1880px] overflow-hidden rounded-[34px] border border-[var(--border-subtle)]/72 bg-cream/36 shadow-[0_30px_90px_rgba(31,30,29,.06)] backdrop-blur-[2px] sm:mt-7 sm:rounded-[44px] lg:min-h-[calc(108vh-150px)]"
      >
        <HeroBackground />
        <WatermarkText opacity={watermarkOpacity} x={watermarkX} letterSpacing={watermarkSpacing} />
        <motion.div
          className="relative z-30 flex min-h-[calc(100svh-126px)] w-full items-start justify-start px-6 pb-28 pt-[7vh] sm:px-10 sm:pb-32 sm:pt-[8vh] lg:min-h-[calc(108vh-150px)] lg:px-16 lg:pb-20 lg:pt-[10vh] xl:px-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
        >
          <div className="w-full max-w-[760px] md:max-w-[880px] lg:max-w-[760px] xl:max-w-[820px]">
            <SplitHeadline
              y={headlineY}
              opacity={headlineOpacity}
              blur={headlineBlur}
              letterSpacing={headlineSpacing}
              parallaxX={parallaxX}
              parallaxY={parallaxY}
            />

            <div className="mt-7 lg:ml-8 lg:mt-8 xl:ml-10">
              <HeroCTAGroup align="left" />
            </div>
          </div>
        </motion.div>

        <div
          className="pointer-events-auto absolute bottom-[-6vh] left-1/2 z-20 h-[42vh] w-[82vw] max-w-[620px] -translate-x-1/2 sm:bottom-[-4vh] sm:h-[44vh] md:bottom-[-2vh] md:left-auto md:right-[-18vw] md:h-[48vh] md:w-[48vw] md:max-w-[640px] lg:bottom-[-2vh] lg:right-[-31vw] lg:h-[78vh] lg:w-[50vw] xl:bottom-[-1vh] xl:right-[-24vw] xl:h-[84vh] xl:w-[46vw] 2xl:right-[-12vw] 2xl:h-[86vh] 2xl:w-[41vw]"
          onPointerDown={triggerMascot}
        >
          <MascotCanvas scrollProgress={scrollProgress} mouseRef={mouseRef} onMascotClick={triggerMascot} toastMessage={toastMessage} burstId={burstId} />
        </div>
      </div>
    </section>
  );
}
