"use client";

import { RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import type { ApiKeyRecentRequest } from "@/lib/keys/types";
import { buildSvgPath, buildUsageSeries } from "@/lib/dashboard-utils";
import { formatCompactToken } from "@/components/dashboard/RecentRequestsTable";

type UsageChartProps = {
  requests?: ApiKeyRecentRequest[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
  dataState?: "ready" | "empty" | "unavailable";
};

export function UsageChart({
  requests = [],
  onRefresh,
  isRefreshing = false,
  dataState = "ready",
}: UsageChartProps) {
  const points = buildUsageSeries(requests);
  const path = buildSvgPath(points);
  const totalTokens = points.reduce((sum, point) => sum + point.value, 0);
  const totalRequests = points.reduce((sum, point) => sum + point.requests, 0);
  const isEmpty = points.length === 0;
  const emptyText = dataState === "unavailable"
    ? "실제 요청 로그를 확인하지 못했습니다."
    : "표시할 실제 사용량 흐름이 아직 없습니다.";

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-cream shadow-md"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border-subtle)] p-6 sm:p-7">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral/75">USAGE FLOW</p>
          <h3 className="mt-2 text-[24px] font-[560] tracking-[-0.018em] text-primary">사용량 흐름</h3>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-cream-2/60 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary transition hover:border-coral/50 hover:text-coral disabled:opacity-50"
        >
          <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
          30s live
        </button>
      </div>

      <div className="grid gap-5 p-6 sm:p-7 lg:grid-cols-[1fr_220px]">
        <div className="relative h-[260px] overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(251,246,236,.96),rgba(240,226,210,.42))] p-4">
          <div className="pointer-events-none absolute inset-4 grid grid-rows-4">
            {[0, 1, 2, 3].map((line) => (
              <span key={line} className="border-t border-primary/[0.06]" />
            ))}
          </div>
          {isEmpty ? (
            <div className="relative z-[1] grid h-full place-items-center text-center">
              <p className="max-w-sm text-sm leading-6 text-secondary">{emptyText}</p>
            </div>
          ) : (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="relative z-[1] h-full w-full overflow-visible">
              <defs>
                <linearGradient id="dashboardUsageFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--coral)" stopOpacity="0.28" />
                  <stop offset="68%" stopColor="var(--coral)" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="var(--coral)" stopOpacity="0" />
                </linearGradient>
                <filter id="dashboardUsageGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.8" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path d={`${path} L 100 100 L 0 100 Z`} fill="url(#dashboardUsageFill)" />
              <motion.path
                d={path}
                fill="none"
                stroke="var(--coral)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                filter="url(#dashboardUsageGlow)"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              />
              {points.map((point) => (
                <g key={point.label}>
                  <circle cx={point.x} cy={point.y} r="2.2" fill="var(--cream)" stroke="var(--coral)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
                </g>
              ))}
            </svg>
          )}
        </div>

        <div className="grid content-between gap-4 rounded-2xl border border-[var(--border-subtle)] bg-cream-2/45 p-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-secondary/60">visible window</p>
            <p className="mt-2 text-3xl font-bold tracking-[-0.03em] text-primary">{points.length}</p>
            <p className="mt-1 text-xs text-secondary">날짜 그룹</p>
          </div>
          <div className="grid gap-3 border-t border-[var(--border-subtle)] pt-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold text-secondary">요청</span>
              <span className="font-mono text-sm font-bold text-primary">{totalRequests.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold text-secondary">토큰</span>
              <span className="font-mono text-sm font-bold text-coral">{formatCompactToken(totalTokens)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
