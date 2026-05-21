"use client";
import { motion } from "framer-motion";
import type { ApiKeyRecentRequest } from "@/lib/keys/types";
import { formatDateTime, formatUsd } from "@/lib/format";

type RecentRequestsTableProps = {
  requests?: ApiKeyRecentRequest[];
};

export function formatCompactToken(num: number): string {
  if (num < 1000) {
    return String(Math.round(num));
  }
  if (num < 1000000) {
    return Math.round(num / 1000) + "K";
  }
  return Math.round(num / 1000000) + "M";
}

export function getModelDisplayName(model: string): string | null {
  const m = model.toLowerCase();
  if (m.includes("sonnet") || m.includes("소넷")) {
    return "소넷 4.6";
  }
  if (m.includes("opus") || m.includes("오푸스")) {
    return "오푸스 4.7";
  }
  if (m.includes("haiku") || m.includes("하이쿠")) {
    return "하이쿠 4.5";
  }
  return null;
}

export function RecentRequestsTable({ requests = [] }: RecentRequestsTableProps) {
  // Filter out requests that don't match the allowed models, and map their display names
  const displayedRequests = requests
    .map((request) => {
      const displayName = getModelDisplayName(request.requestedModel);
      return displayName ? { ...request, displayName } : null;
    })
    .filter((req): req is (ApiKeyRecentRequest & { displayName: string }) => req !== null);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-[var(--border-subtle)] bg-cream shadow-md"
    >
      <div className="border-b border-[var(--border-subtle)] p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral/75">· RECENT REQUESTS</p>
        <h3 className="mt-2 text-[24px] font-[560] tracking-[-0.018em] text-primary">최근 요청</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-cream-2/70 font-mono text-[11px] uppercase tracking-[0.12em] text-secondary">
            <tr>
              <th className="sticky left-0 z-[1] bg-cream-2/95 px-5 py-4 font-medium backdrop-blur">모델명</th>
              <th className="px-5 py-4 text-center font-medium">추론난이도</th>
              <th className="px-5 py-4 text-right font-medium">토큰</th>
              <th className="px-5 py-4 text-right font-medium">비용</th>
              <th className="px-5 py-4 font-medium">시간</th>
              <th className="px-5 py-4 text-center font-medium">처리</th>
            </tr>
          </thead>
          <tbody>
            {displayedRequests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-14 text-center text-sm text-secondary">
                  최근 내역이 없습니다.
                </td>
              </tr>
            ) : (
              displayedRequests.map((request) => (
                <motion.tr
                  key={request.requestId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative border-t border-[rgba(232,224,210,0.55)] transition duration-200 hover:bg-cream-2/55"
                >
                  <td className="sticky left-0 bg-cream px-5 py-4 font-mono text-[13px] text-primary transition group-hover:bg-cream-2/95">
                     <span className="absolute left-0 top-3 h-[calc(100%-24px)] w-px bg-coral opacity-0 transition group-hover:opacity-60" />
                    <span className="text-mono break-all font-mono font-medium">{request.displayName}</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center rounded-md bg-cream-2 px-2.5 py-1 font-mono text-[11px] font-semibold text-secondary">
                      {request.reasoningEffort || "기본값"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-[13px] tabular-nums text-primary">
                    {formatCompactToken(request.totalTokens)}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-[13px] font-medium tabular-nums text-coral">
                    {formatUsd(request.costUsd)}
                  </td>
                  <td className="px-5 py-4 font-mono text-[13px] text-secondary">
                    {formatDateTime(request.createdAt)}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {request.processing || "성공"}
                    </span>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}
