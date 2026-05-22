"use client";

import { motion } from "framer-motion";
import type { ApiKeyRecentRequest } from "@/lib/keys/types";
import { formatDateTime, formatUsd } from "@/lib/format";

type RecentRequestsTableProps = {
  requests?: ApiKeyRecentRequest[];
  dataState?: "ready" | "empty" | "unavailable";
};

export function formatCompactToken(num: number): string {
  if (num < 1000) return String(Math.round(num));
  if (num < 1000000) return `${Math.round(num / 1000)}K`;
  return `${Math.round(num / 1000000)}M`;
}

function displayModelName(model: string): string {
  if (!model || model === "unknown") return "unknown";
  return model;
}

function statusLabel(value: string | undefined): string {
  const normalized = (value || "success").toLowerCase();
  if (normalized === "success" || normalized === "200") return "success";
  return value || "success";
}

export function RecentRequestsTable({ requests = [], dataState = "ready" }: RecentRequestsTableProps) {
  const emptyMessage = dataState === "unavailable"
    ? "실제 요청 로그를 upstream에서 확인하지 못했습니다. 가짜 데이터는 표시하지 않습니다."
    : "이 키로 확인된 실제 요청이 아직 없습니다.";

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-[var(--border-subtle)] bg-cream shadow-md"
    >
      <div className="border-b border-[var(--border-subtle)] p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral/75">RECENT REQUESTS</p>
        <h3 className="mt-2 text-[24px] font-[560] tracking-[-0.018em] text-primary">최근 요청</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-cream-2/70 font-mono text-[11px] uppercase tracking-[0.12em] text-secondary">
            <tr>
              <th className="sticky left-0 z-[1] bg-cream-2/95 px-5 py-4 font-medium backdrop-blur">MODEL</th>
              <th className="px-5 py-4 text-center font-medium">REASONING</th>
              <th className="px-5 py-4 text-right font-medium">INPUT</th>
              <th className="px-5 py-4 text-right font-medium">OUTPUT</th>
              <th className="px-5 py-4 text-right font-medium">TOTAL</th>
              <th className="px-5 py-4 text-right font-medium">COST</th>
              <th className="px-5 py-4 font-medium">TIME</th>
              <th className="px-5 py-4 text-center font-medium">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-14 text-center text-sm leading-6 text-secondary">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              requests.slice(0, 10).map((request) => (
                <motion.tr
                  key={request.requestId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative border-t border-[rgba(232,224,210,0.55)] transition duration-200 hover:bg-cream-2/55"
                >
                  <td className="sticky left-0 bg-cream px-5 py-4 font-mono text-[13px] text-primary transition group-hover:bg-cream-2/95">
                    <span className="absolute left-0 top-3 h-[calc(100%-24px)] w-px bg-coral opacity-0 transition group-hover:opacity-60" />
                    <span className="break-all font-mono font-medium">{displayModelName(request.requestedModel)}</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center rounded-md bg-cream-2 px-2.5 py-1 font-mono text-[11px] font-semibold text-secondary">
                      {request.reasoningEffort || "default"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-[13px] tabular-nums text-secondary">
                    {formatCompactToken(request.inputTokens ?? 0)}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-[13px] tabular-nums text-secondary">
                    {formatCompactToken(request.outputTokens ?? 0)}
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
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {statusLabel(request.processing)}
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
