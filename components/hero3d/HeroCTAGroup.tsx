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
      <StartGateLink className="group inline-flex min-h-[60px] sm:min-h-[66px] xl:min-h-[72px] w-full items-center justify-between gap-6 rounded-full bg-primary py-1.5 pl-8 pr-1.5 text-[16px] sm:text-[17.5px] xl:text-[18.5px] font-bold text-cream shadow-[0_16px_44px_rgba(31,30,29,.17)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_56px_rgba(31,30,29,.2)] sm:w-auto select-none">
        <span>시작하기</span>
        <span className="grid h-11 w-11 sm:h-13 sm:w-13 xl:h-[58px] xl:w-[58px] place-items-center rounded-full bg-coral text-cream transition group-hover:translate-x-0.5 group-hover:bg-coral-hi">↘</span>
      </StartGateLink>
      <DashboardGateLink className="group inline-flex min-h-[60px] sm:min-h-[66px] xl:min-h-[72px] w-full sm:w-auto items-center justify-center rounded-full border border-[rgba(217,119,87,0.24)] bg-coral/5 px-7 text-[15px] sm:text-[16px] xl:text-[17px] font-extrabold text-coral-solid transition-all duration-300 hover:border-coral hover:bg-coral/10 hover:-translate-y-0.5 active:scale-98 sm:ml-3 shadow-[0_4px_16px_rgba(217,119,87,0.03)] select-none">
        대시보드 ↗
      </DashboardGateLink>
    </motion.div>
  );
}
