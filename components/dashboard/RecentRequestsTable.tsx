"use client";

import { motion } from "framer-motion";
import type { ApiKeyRecentRequest } from "@/lib/keys/types";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { formatDateTime, formatNumber, formatUsd } from "@/lib/format";

type RecentRequestsTableProps = {
  requests?: ApiKeyRecentRequest[];
};

export function RecentRequestsTable({ requests = [] }: RecentRequestsTableProps) {
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
              <th className="sticky left-0 z-[1] bg-cream-2/95 px-5 py-4 font-medium backdrop-blur">시간</th>
              <th className="px-5 py-4 font-medium">모델</th>
              <th className="px-5 py-4 text-right font-medium">토큰</th>
              <th className="px-5 py-4 text-right font-medium">지연 시간</th>
              <th className="px-5 py-4 text-right font-medium">비용</th>
              <th className="px-5 py-4 text-center font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-14 text-center text-sm text-secondary">
                  최근 내역이 없습니다.
                </td>
              </tr>
            ) : (
              requests.map((request, index) => (
                <motion.tr
                  key={request.requestId}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: index * 0.04, duration: 0.35 }}
                  className="group relative border-t border-[rgba(232,224,210,0.55)] transition duration-200 hover:bg-cream-2/55"
                >
                  <td className="sticky left-0 bg-cream px-5 py-4 font-mono text-[13px] text-secondary transition group-hover:bg-cream-2/95">
                    <span className="absolute left-0 top-3 h-[calc(100%-24px)] w-px bg-coral opacity-0 transition group-hover:opacity-60" />
                    {formatDateTime(request.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-mono break-all font-mono text-[13px] text-primary">{request.requestedModel}</span>
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-[13px] tabular-nums text-primary">{formatNumber(request.totalTokens)}</td>
                  <td className="px-5 py-4 text-right font-mono text-[13px] tabular-nums text-primary">
                    {formatNumber(request.latencyMs)} <span className="text-[11px] text-secondary">ms</span>
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-[13px] font-medium tabular-nums text-coral">{formatUsd(request.costUsd)}</td>
                  <td className="px-5 py-4 text-center"><StatusBadge value={request.statusCode} /></td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="border-t border-[var(--border-subtle)] px-6 py-4">
        <a href="/#pricing" className="text-sm font-semibold text-coral underline decoration-coral/30 underline-offset-4 transition hover:decoration-coral">
          더 보기 →
        </a>
      </div>
    </motion.section>
  );
}
