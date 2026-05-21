"use client";

import { motion } from "framer-motion";
import type { ApiKeyRecentRequest } from "@/lib/keys/types";
import { buildSvgPath, buildUsageSeries } from "@/lib/dashboard-utils";

type UsageChartProps = {
  requests?: ApiKeyRecentRequest[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

export function UsageChart({ requests = [], onRefresh, isRefreshing = false }: UsageChartProps) {
  // 실제 요청 내역이 없을 때도 레이아웃이 비지 않도록 안전한 신호선을 만든다.
  const points = buildUsageSeries(requests);
  const path = buildSvgPath(points);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-[var(--border-subtle)] bg-cream p-6 shadow-md sm:p-7"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral/75">· USAGE SIGNAL</p>
          <h3 className="mt-2 text-[24px] font-[560] tracking-[-0.018em] text-primary">사용량 흐름</h3>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`group flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-secondary/65 hover:text-coral transition-colors duration-200 disabled:opacity-50 ${isRefreshing ? "animate-pulse" : ""}`}
        >
          <span className={`inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 ${isRefreshing ? "animate-ping" : "animate-pulse"}`} />
          live · auto-refresh 30s {isRefreshing ? "(refreshing...)" : ""}
        </button>
      </div>
      <div className="mt-6 h-[220px] rounded-2xl border border-[var(--border-subtle)] bg-cream-2/45 p-4">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id="dashboardUsageFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--coral)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--coral)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${path} L 100 100 L 0 100 Z`} fill="url(#dashboardUsageFill)" />
          <motion.path
            d={path}
            fill="none"
            stroke="var(--coral)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
          {points.map((point, index) => (
            <circle key={`${point.x}-${index}`} cx={point.x} cy={point.y} r="1.5" fill="var(--coral)" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
      </div>
    </motion.section>
  );
}
