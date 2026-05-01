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
      <DashboardGateLink className="inline-flex min-h-[64px] w-full items-center justify-center rounded-full border border-coral/28 bg-[linear-gradient(135deg,rgba(247,241,232,.98),rgba(240,226,210,.94)_50%,rgba(217,119,87,.16))] px-10 text-[17px] font-bold text-primary shadow-[0_14px_42px_rgba(217,119,87,.14)] ring-1 ring-white/60 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-coral/52 hover:bg-[linear-gradient(135deg,rgba(247,241,232,1),rgba(240,226,210,.98)_45%,rgba(217,119,87,.24))] hover:shadow-[0_20px_58px_rgba(217,119,87,.2)] sm:w-auto">
        대시보드
      </DashboardGateLink>
    </motion.div>
  );
}
