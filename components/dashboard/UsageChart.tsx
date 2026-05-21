"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { ApiKeyRecentRequest } from "@/lib/keys/types";
import { buildSvgPath, buildUsageSeries } from "@/lib/dashboard-utils";

type UsageChartProps = {
  requests?: ApiKeyRecentRequest[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

export function UsageChart({ requests = [], onRefresh, isRefreshing = false }: UsageChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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
      
      <div className="relative mt-6 h-[220px] rounded-2xl border border-[var(--border-subtle)] bg-cream-2/45 p-4 overflow-visible">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id="dashboardUsageFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--coral)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--coral)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Dotted Gridlines */}
          {/* Horizontal lines */}
          <line x1="0" y1="18" x2="100" y2="18" stroke="var(--border-subtle)" strokeWidth="0.5" strokeDasharray="1 3" vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="42.6" x2="100" y2="42.6" stroke="var(--border-subtle)" strokeWidth="0.5" strokeDasharray="1 3" vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="67.3" x2="100" y2="67.3" stroke="var(--border-subtle)" strokeWidth="0.5" strokeDasharray="1 3" vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="92" x2="100" y2="92" stroke="var(--border-subtle)" strokeWidth="0.5" strokeDasharray="1 3" vectorEffect="non-scaling-stroke" />

          {/* Vertical lines */}
          <line x1="20" y1="18" x2="20" y2="92" stroke="var(--border-subtle)" strokeWidth="0.5" strokeDasharray="1 3" vectorEffect="non-scaling-stroke" />
          <line x1="40" y1="18" x2="40" y2="92" stroke="var(--border-subtle)" strokeWidth="0.5" strokeDasharray="1 3" vectorEffect="non-scaling-stroke" />
          <line x1="60" y1="18" x2="60" y2="92" stroke="var(--border-subtle)" strokeWidth="0.5" strokeDasharray="1 3" vectorEffect="non-scaling-stroke" />
          <line x1="80" y1="18" x2="80" y2="92" stroke="var(--border-subtle)" strokeWidth="0.5" strokeDasharray="1 3" vectorEffect="non-scaling-stroke" />

          {/* Hover Vertical Guide Line */}
          {hoveredIndex !== null && points[hoveredIndex] && (
            <line 
              x1={points[hoveredIndex].x} 
              y1="18" 
              x2={points[hoveredIndex].x} 
              y2="92" 
              stroke="var(--coral)" 
              strokeWidth="0.8" 
              strokeDasharray="2 2" 
              vectorEffect="non-scaling-stroke" 
            />
          )}

          {/* Curve fill & path */}
          <path d={`${path} L 100 100 L 0 100 Z`} fill="url(#dashboardUsageFill)" />
          <motion.path
            d={path}
            fill="none"
            stroke="var(--coral)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Dual Glowing Nodes */}
          {points.map((point, index) => (
            <g key={`${point.x}-${index}`}>
              {/* Outer Glowing Ring */}
              <circle 
                cx={point.x} 
                cy={point.y} 
                r={hoveredIndex === index ? "4.5" : "3"} 
                fill="var(--coral)" 
                fillOpacity={hoveredIndex === index ? "0.3" : "0.15"} 
                vectorEffect="non-scaling-stroke" 
                className="transition-all duration-200"
              />
              {/* Inner Solid Dot */}
              <circle 
                cx={point.x} 
                cy={point.y} 
                r="1.5" 
                fill={hoveredIndex === index ? "var(--coral)" : "var(--cream)"} 
                stroke="var(--coral)" 
                strokeWidth="1.2" 
                vectorEffect="non-scaling-stroke" 
                className="transition-all duration-200"
              />
              
              {/* Interactive Hover Hotspot */}
              <circle
                cx={point.x}
                cy={point.y}
                r="7"
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            </g>
          ))}
        </svg>

        {/* Floating Glassmorphic Tooltip */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div 
            className="absolute z-20 pointer-events-none rounded-xl border border-coral/25 bg-cream/90 px-3.5 py-2.5 shadow-xl backdrop-blur-md transition-all duration-100 ease-out text-left"
            style={{
              left: `${points[hoveredIndex].x}%`,
              top: `${points[hoveredIndex].y}%`,
              transform: 'translate(-50%, -120%)',
              marginTop: '-12px'
            }}
          >
            <p className="font-mono text-[9px] uppercase tracking-wider text-secondary/60 select-none">
              {points[hoveredIndex].label.includes('-')
                ? new Date(points[hoveredIndex].label).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : points[hoveredIndex].label}
            </p>
            <p className="mt-1 font-mono text-[13px] font-bold text-primary tabular-nums">
              {points[hoveredIndex].value.toLocaleString()} <span className="text-[10px] text-coral font-sans">tokens</span>
            </p>
          </div>
        )}
      </div>
    </motion.section>
  );
}
