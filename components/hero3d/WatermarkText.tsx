"use client";

import { motion, type MotionValue } from "framer-motion";

export function WatermarkText({ opacity, x, letterSpacing }: { opacity: MotionValue<number>; x: MotionValue<number>; letterSpacing: MotionValue<string> }) {
  return (
    <>
      <motion.div
        aria-hidden="true"
        style={{ opacity, x, letterSpacing }}
        className="pointer-events-none absolute left-[1.2vw] top-[79%] z-[1] select-none whitespace-nowrap text-left text-[clamp(48px,14vw,72px)] font-black leading-none text-primary sm:left-[1.6vw] sm:text-[clamp(88px,12.8vw,188px)] md:left-[1.9vw] md:top-[75%] md:text-[clamp(118px,12.6vw,210px)] lg:left-[2vw] lg:top-[69%] lg:text-[clamp(150px,12.8vw,230px)] xl:left-[2vw] xl:top-[69%] xl:text-[clamp(170px,12.65vw,240px)] 2xl:left-[2.1vw] 2xl:top-[69%] 2xl:text-[clamp(190px,12.25vw,238px)]"
      >
        CLCOCLOUD
      </motion.div>
      <motion.div
        aria-hidden="true"
        style={{ opacity: 0.086, x, letterSpacing }}
        className="pointer-events-none absolute right-[12vw] top-[2%] z-[1] hidden select-none whitespace-nowrap text-right text-[clamp(190px,15vw,280px)] font-black leading-none text-coral lg:block xl:right-[13vw] xl:top-[2%] xl:text-[clamp(220px,14vw,320px)] 2xl:right-[14vw] 2xl:top-[2.5%] 2xl:text-[clamp(240px,13vw,340px)]"
      >
        API
      </motion.div>
    </>
  );
}
