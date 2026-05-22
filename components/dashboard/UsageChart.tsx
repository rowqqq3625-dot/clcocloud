"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ApiKeyRecentRequest } from "@/lib/keys/types";
import { buildMultiSeriesUsage, buildSmoothPath, buildSmoothAreaPath } from "@/lib/dashboard-utils";
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  const points = buildMultiSeriesUsage(requests);
  const isEmpty = points.length === 0;

  // 전체 합산 통계 계산
  const totalTokens = points.reduce((sum, p) => sum + p.totalTokens, 0);
  const totalRequests = points.reduce((sum, p) => sum + p.totalRequests, 0);

  const opusTokens = points.reduce((sum, p) => sum + p.opusTokens, 0);
  const opusRequests = points.reduce((sum, p) => sum + p.opusRequests, 0);

  const sonnetTokens = points.reduce((sum, p) => sum + p.sonnetTokens, 0);
  const sonnetRequests = points.reduce((sum, p) => sum + p.sonnetRequests, 0);

  const haikuTokens = points.reduce((sum, p) => sum + p.haikuTokens, 0);
  const haikuRequests = points.reduce((sum, p) => sum + p.haikuRequests, 0);

  const emptyText = dataState === "unavailable"
    ? "실제 요청 로그를 확인하지 못했습니다."
    : "표시할 실제 사용량 흐름이 아직 없습니다.";

  // Bezier Paths 계산
  const totalPoints = points.map(p => ({ x: p.x, y: p.totalY }));
  const opusPoints = points.map(p => ({ x: p.x, y: p.opusY }));
  const sonnetPoints = points.map(p => ({ x: p.x, y: p.sonnetY }));
  const haikuPoints = points.map(p => ({ x: p.x, y: p.haikuY }));

  const totalPath = buildSmoothPath(totalPoints);
  const opusPath = buildSmoothPath(opusPoints);
  const sonnetPath = buildSmoothPath(sonnetPoints);
  const haikuPath = buildSmoothPath(haikuPoints);

  const totalAreaPath = buildSmoothAreaPath(totalPoints);
  const opusAreaPath = buildSmoothAreaPath(opusPoints);
  const sonnetAreaPath = buildSmoothAreaPath(sonnetPoints);
  const haikuAreaPath = buildSmoothAreaPath(haikuPoints);

  // 마우스 움직임에 따른 인덱스 트래킹
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!chartContainerRef.current || points.length === 0) return;
    const rect = chartContainerRef.current.getBoundingClientRect();
    const paddingX = 16;
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

  // 모델 세부 정보 정의
  const seriesInfo = [
    { key: "total", name: "Total (전체)", color: "#DE6E5C", tokens: totalTokens, requests: totalRequests },
    { key: "opus", name: "Opus 4-7", color: "#3A3734", tokens: opusTokens, requests: opusRequests },
    { key: "sonnet", name: "Sonnet 4-6", color: "#E4A853", tokens: sonnetTokens, requests: sonnetRequests },
    { key: "haiku", name: "Haiku 4-5", color: "#6B9A7C", tokens: haikuTokens, requests: haikuRequests },
  ];

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

      <div className="grid gap-5 p-6 sm:p-7 lg:grid-cols-[1fr_260px]">
        {/* 차트 영역 */}
        <div
          ref={chartContainerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIndex(null)}
          className="relative h-[280px] overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(247,241,232,0.95),rgba(251,246,236,0.3))] p-4 cursor-crosshair select-none"
        >
          {/* 그리드 라인 */}
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
              {/* Premium 세로 가이드 라인 */}
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

              {/* 4개 채널 SVG 복합 차트 */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="relative z-[1] h-full w-full overflow-hidden rounded-2xl">
                <defs>
                  {/* 그라데이션 영역 선언 */}
                  <linearGradient id="totalFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#DE6E5C" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#DE6E5C" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="opusFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#3A3734" stopOpacity="0.10" />
                    <stop offset="100%" stopColor="#3A3734" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="sonnetFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#E4A853" stopOpacity="0.10" />
                    <stop offset="100%" stopColor="#E4A853" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="haikuFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#6B9A7C" stopOpacity="0.10" />
                    <stop offset="100%" stopColor="#6B9A7C" stopOpacity="0" />
                  </linearGradient>

                  {/* 글로우 필터 제거됨 (원반 형태의 납작한 타원 그래픽 왜곡 방지) */}
                </defs>

                {/* 1. 채우기 영역 (Fills) */}
                <path d={totalAreaPath} fill="url(#totalFill)" />
                <path d={opusAreaPath} fill="url(#opusFill)" />
                <path d={sonnetAreaPath} fill="url(#sonnetFill)" />
                <path d={haikuAreaPath} fill="url(#haikuFill)" />

                {/* 2. 주 곡선 선 (Primary Line paths) - 선 끊김 현상을 원천 차단하기 위해 pathLength 대신 opacity 페이드인을 채택하고 strokeLinecap="round" 설정 */}
                <motion.path
                  d={totalPath}
                  fill="none"
                  stroke="#DE6E5C"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
                <motion.path
                  d={opusPath}
                  fill="none"
                  stroke="#3A3734"
                  strokeWidth="2.0"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
                <motion.path
                  d={sonnetPath}
                  fill="none"
                  stroke="#E4A853"
                  strokeWidth="2.0"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
                <motion.path
                  d={haikuPath}
                  fill="none"
                  stroke="#6B9A7C"
                  strokeWidth="2.0"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </svg>

              {/* 호버 시 해당 날짜의 4대 채널 좌표 타깃 도넛 원(Spring Dot) 피드백 */}
              <div className="absolute inset-4 pointer-events-none z-[3]">
                {hoveredIndex !== null && points[hoveredIndex] && (
                  <>
                    {[
                      { y: points[hoveredIndex].totalY, color: "#DE6E5C" },
                      { y: points[hoveredIndex].opusY, color: "#3A3734" },
                      { y: points[hoveredIndex].sonnetY, color: "#E4A853" },
                      { y: points[hoveredIndex].haikuY, color: "#6B9A7C" },
                    ].map((dot, idx) => (
                      <div
                        key={idx}
                        className="absolute"
                        style={{
                          left: `${points[hoveredIndex!].x}%`,
                          top: `${dot.y}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                      >
                        {/* 외부 스프링 링 */}
                        <motion.div
                          className="absolute rounded-full pointer-events-none"
                          style={{
                            width: "18px",
                            height: "18px",
                            border: `2px solid ${dot.color}`,
                            backgroundColor: `${dot.color}20`,
                          }}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1.5, opacity: 0.5 }}
                          transition={{ type: "spring", stiffness: 350, damping: 20 }}
                        />
                        {/* 내부 코어 도트 */}
                        <motion.div
                          className="relative h-2.5 w-2.5 rounded-full border border-cream shadow"
                          style={{ backgroundColor: dot.color }}
                        />
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* 고성능 Magnetic Spring 멀티 다차원 툴팁 */}
              <div className="absolute inset-4 pointer-events-none z-[10]">
                <AnimatePresence>
                  {hoveredIndex !== null && points[hoveredIndex] && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.93, y: 10 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        left: `${points[hoveredIndex].x}%`,
                        top: `${Math.min(points[hoveredIndex].totalY, points[hoveredIndex].opusY, points[hoveredIndex].sonnetY, points[hoveredIndex].haikuY) - 10}%`,
                      }}
                      exit={{ opacity: 0, scale: 0.93, y: 10 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 24,
                      }}
                      className="absolute z-10 rounded-2xl border border-[var(--border-subtle)] bg-cream/95 backdrop-blur-md p-3.5 shadow-2xl pointer-events-none"
                      style={{
                        transform: "translateX(-50%) translateY(-100%)",
                        width: "240px",
                        boxShadow: "0 12px 36px -12px rgba(58, 55, 52, 0.25)",
                      }}
                    >
                      {/* 날짜 */}
                      <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-secondary border-b border-[var(--border-subtle)] pb-1.5 mb-2">
                        📅 {points[hoveredIndex].label}
                      </p>

                      {/* 모델 상세 비교 테이블 */}
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="text-secondary/60 font-mono text-[9px] uppercase">
                            <th className="pb-1 font-semibold">모델</th>
                            <th className="pb-1 text-right font-semibold">요청</th>
                            <th className="pb-1 text-right font-semibold">토큰</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { name: "Total", color: "#DE6E5C", req: points[hoveredIndex].totalRequests, tok: points[hoveredIndex].totalTokens },
                            { name: "Opus", color: "#3A3734", req: points[hoveredIndex].opusRequests, tok: points[hoveredIndex].opusTokens },
                            { name: "Sonnet", color: "#E4A853", req: points[hoveredIndex].sonnetRequests, tok: points[hoveredIndex].sonnetTokens },
                            { name: "Haiku", color: "#6B9A7C", req: points[hoveredIndex].haikuRequests, tok: points[hoveredIndex].haikuTokens },
                          ].map((item, idx) => (
                            <tr key={idx} className={item.name === "Total" ? "border-t border-[var(--border-subtle)] font-semibold" : ""}>
                              <td className="py-1 flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-primary">{item.name}</span>
                              </td>
                              <td className="py-1 text-right font-mono font-medium text-secondary">
                                {item.req.toLocaleString()}건
                              </td>
                              <td className="py-1 text-right font-mono font-medium" style={{ color: item.color }}>
                                {formatCompactToken(item.tok)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>

        {/* 오른쪽 모델별 요약 스택 리스트 카드 */}
        <div className="grid content-between gap-4 rounded-2xl border border-[var(--border-subtle)] bg-cream-2/45 p-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-secondary/60">visible window</p>
            <p className="mt-1.5 text-2xl font-bold tracking-[-0.03em] text-primary">{points.length} 일</p>
            <p className="mt-0.5 text-[11px] text-secondary">수집된 실제 데이터 기간</p>
          </div>

          <div className="border-t border-[var(--border-subtle)] pt-4">
            <p className="font-mono text-[9px] uppercase tracking-wider text-secondary/50 font-bold mb-2">MODEL SPECIFICS</p>
            <div className="grid gap-2.5">
              {seriesInfo.map((info) => (
                <div key={info.key} className="flex flex-col gap-0.5 text-xs">
                  <div className="flex items-center justify-between font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: info.color }} />
                      <span className="text-primary text-[11px]">{info.name}</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-primary">{info.requests.toLocaleString()}건</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-secondary/70 font-mono pl-4">
                    <span>누적 토큰</span>
                    <span style={{ color: info.color }} className="font-semibold">{formatCompactToken(info.tokens)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
