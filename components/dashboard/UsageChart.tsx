"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ApiKeyRecentRequest } from "@/lib/keys/types";
import { buildUsageSeries } from "@/lib/dashboard-utils";
import { formatCompactToken } from "@/components/dashboard/RecentRequestsTable";

type UsageChartProps = {
  requests?: ApiKeyRecentRequest[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
  dataState?: "ready" | "empty" | "unavailable";
};

// Catmull-Rom to Cubic Bezier smooth curve interpolation
function getBezierPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  if (points.length === 1) {
    // Elegant horizontal flow across the entire chart area to prevent squeezed oval disc caps
    return `M 0 ${points[0].y.toFixed(2)} L 100 ${points[0].y.toFixed(2)}`;
  }

  const k = 0.22; // smoothness coefficient (Catmull-Rom-like tension)
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    const cp1x = p1.x + (p2.x - p0.x) * k;
    const cp1y = p1.y + (p2.y - p0.y) * k;

    const cp2x = p2.x - (p3.x - p1.x) * k;
    const cp2y = p2.y - (p3.y - p1.y) * k;

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return d;
}

export function UsageChart({
  requests = [],
  onRefresh,
  isRefreshing = false,
  dataState = "ready",
}: UsageChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  const points = buildUsageSeries(requests);
  const path = getBezierPath(points);
  const totalTokens = points.reduce((sum, point) => sum + point.value, 0);
  const totalRequests = points.reduce((sum, point) => sum + point.requests, 0);
  const isEmpty = points.length === 0;

  const emptyText = dataState === "unavailable"
    ? "실제 요청 로그를 확인하지 못했습니다."
    : "표시할 실제 사용량 흐름이 아직 없습니다.";

  // Premium Apple-style sliding track interaction
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!chartContainerRef.current || points.length === 0) return;
    const rect = chartContainerRef.current.getBoundingClientRect();
    const paddingX = 16; // horizontal padding matching inner SVG boundaries
    const chartWidth = rect.width - paddingX * 2;
    const mouseX = e.clientX - rect.left - paddingX;
    const percentX = (mouseX / chartWidth) * 100;

    let closestIndex = 0;
    let minDiff = Infinity;
    points.forEach((point, index) => {
      const diff = Math.abs(point.x - percentX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = index;
      }
    });
    setHoveredIndex(closestIndex);
  };

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
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#DE6E5C] font-semibold">USAGE FLOW</p>
          <h3 className="mt-2 text-[24px] font-[560] tracking-[-0.018em] text-primary">사용량 흐름</h3>
        </div>
      </div>

      <div className="grid gap-5 p-6 sm:p-7 lg:grid-cols-[1fr_220px]">
        <div
          ref={chartContainerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIndex(null)}
          className="relative h-[260px] overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(247,241,232,0.95),rgba(251,246,236,0.3))] p-4 cursor-crosshair select-none"
        >
          {/* Subtle grid backdrop */}
          <div className="pointer-events-none absolute inset-4 grid grid-rows-4">
            {[0, 1, 2, 3].map((line) => (
              <span key={line} className="border-t border-primary/[0.04]" />
            ))}
          </div>

          {isEmpty ? (
            <div className="relative z-[1] grid h-full place-items-center text-center">
              <p className="max-w-sm text-sm leading-6 text-secondary">{emptyText}</p>
            </div>
          ) : (
            <>
              {/* Premium Vertical Tracking Line */}
              <motion.div
                className="absolute top-0 bottom-0 w-px pointer-events-none z-[2]"
                style={{
                  background: "linear-gradient(180deg, rgba(222,110,92,0.35) 0%, rgba(222,110,92,0.1) 80%, rgba(222,110,92,0) 100%)",
                }}
                animate={{
                  left: hoveredIndex !== null && points[hoveredIndex] ? `${points[hoveredIndex].x}%` : "50%",
                  opacity: hoveredIndex !== null ? 1 : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 25,
                }}
              />

              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="relative z-[1] h-full w-full overflow-visible">
                <defs>
                  {/* Subtle soft coral area fill */}
                  <linearGradient id="dashboardUsageFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#DE6E5C" stopOpacity="0.20" />
                    <stop offset="68%" stopColor="#DE6E5C" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="#DE6E5C" stopOpacity="0" />
                  </linearGradient>

                  {/* Horizontal linearGradient blending premium curated HSL brand colors */}
                  <linearGradient id="dashboardUsageLineGradient" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#DE6E5C" /> {/* Total: Soft Coral */}
                    <stop offset="35%" stopColor="#E4A853" /> {/* Sonnet: Gold */}
                    <stop offset="70%" stopColor="#6B9A7C" /> {/* Haiku: Sage Green */}
                    <stop offset="100%" stopColor="#3A3734" /> {/* Opus: Charcoal */}
                  </linearGradient>
                </defs>
                <path d={`${path} L 100 100 L 0 100 Z`} fill="url(#dashboardUsageFill)" />
                
                {/* Continuous Glow under-layer path */}
                <motion.path
                  d={path}
                  fill="none"
                  stroke="url(#dashboardUsageLineGradient)"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.18"
                  style={{ filter: "blur(4px)" }}
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                />

                {/* Continuous Primary path with opacity=1 */}
                <motion.path
                  d={path}
                  fill="none"
                  stroke="url(#dashboardUsageLineGradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  opacity="1"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                />
              </svg>

              {/* Dual Ring target points */}
              <div className="absolute inset-4 pointer-events-none z-[3]">
                {points.map((point, index) => {
                  const isHovered = hoveredIndex === index;
                  return (
                    <div
                      key={point.label}
                      className="absolute pointer-events-auto cursor-pointer"
                      style={{
                        left: `${point.x}%`,
                        top: `${point.y}%`,
                        transform: "translate(-50%, -50%)",
                        width: "32px",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onMouseEnter={() => setHoveredIndex(index)}
                    >
                      {/* Outer spring halo */}
                      <motion.div
                        className="absolute rounded-full border border-[#DE6E5C] bg-[#DE6E5C]/10 pointer-events-none"
                        style={{ width: "24px", height: "24px" }}
                        animate={{
                          scale: isHovered ? 1.8 : 0,
                          opacity: isHovered ? 0.45 : 0,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 25,
                        }}
                      />

                      {/* Inner spring dot */}
                      <motion.div
                        className="relative h-3 w-3 rounded-full border-2 shadow-md"
                        animate={{
                          scale: isHovered ? 1.35 : 1,
                          backgroundColor: isHovered ? "#DE6E5C" : "#F7F1E8",
                          borderColor: isHovered ? "#DE6E5C" : "#DE6E5C",
                          boxShadow: isHovered
                            ? "0 0 12px rgba(222, 110, 92, 0.5)"
                            : "0 2px 4px rgba(0, 0, 0, 0.08)",
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 25,
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Magnetic Spring Tooltip Overlay */}
              <div className="absolute inset-4 pointer-events-none z-[10]">
                <AnimatePresence>
                  {hoveredIndex !== null && points[hoveredIndex] && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92, y: 8 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        left: `${points[hoveredIndex].x}%`,
                        top: `${points[hoveredIndex].y - 8}%`,
                      }}
                      exit={{ opacity: 0, scale: 0.92, y: 8 }}
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 25,
                      }}
                      className="absolute z-10 rounded-2xl border border-[var(--border-subtle)] bg-cream/95 backdrop-blur-md p-4 shadow-xl pointer-events-none"
                      style={{
                        transform: "translateX(-50%) translateY(-100%)",
                        minWidth: "150px",
                        boxShadow: "0 10px 30px -10px rgba(58, 55, 52, 0.15)",
                      }}
                    >
                      <p className="font-mono text-[10px] uppercase tracking-wider text-secondary">
                        {points[hoveredIndex].label}
                      </p>
                      <div className="mt-2.5 flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-1.5 mb-1.5">
                        <span className="text-[11px] font-semibold text-secondary">요청</span>
                        <span className="font-mono text-xs font-bold text-primary font-semibold">
                          {points[hoveredIndex].requests.toLocaleString()} 건
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[11px] font-semibold text-secondary">토큰</span>
                        <span className="font-mono text-xs font-bold text-[#DE6E5C]">
                          {formatCompactToken(points[hoveredIndex].value)}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
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
              <span className="font-mono text-sm font-bold text-[#DE6E5C]">{formatCompactToken(totalTokens)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
