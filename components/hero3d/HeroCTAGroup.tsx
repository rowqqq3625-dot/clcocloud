"use client";

import { motion } from "framer-motion";
import { DashboardGateLink } from "@/components/navigation/DashboardGateLink";
import { StartGateLink } from "@/components/navigation/StartGateLink";

export function HeroCTAGroup({ align = "center" }: { align?: "center" | "left" }) {
  return (
    <motion.div
      className={`relative z-40 flex w-full max-w-[470px] flex-col items-center gap-3 px-5 sm:max-w-none sm:flex-row sm:gap-5 sm:px-0 ${align === "left" ? "mx-auto justify-center lg:mx-0 lg:justify-start" : "mx-auto justify-center"}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.92, duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
    >
      <StartGateLink className="group inline-flex min-h-[64px] w-full items-center justify-between gap-5 rounded-full bg-primary py-1 pl-8 pr-1 text-[17px] font-bold text-cream shadow-[0_16px_44px_rgba(31,30,29,.17)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_56px_rgba(31,30,29,.2)] sm:w-auto">
        <span>시작하기</span>
        <span className="grid h-14 w-14 place-items-center rounded-full bg-coral text-cream transition group-hover:translate-x-0.5 group-hover:bg-coral-hi">↘</span>
      </StartGateLink>
      <DashboardGateLink className="group relative inline-flex items-center justify-center text-[15px] font-semibold text-coral-solid transition hover:text-coral-deep py-2 sm:py-0 sm:ml-2">
        <span className="relative">
          이 잔액으로 시작 →
          <span className="absolute left-0 bottom-[-2px] w-full h-[0.5px] bg-coral transition-transform duration-300 origin-left scale-x-100 group-hover:scale-x-110" />
        </span>
      </DashboardGateLink>
    </motion.div>
  );
}
