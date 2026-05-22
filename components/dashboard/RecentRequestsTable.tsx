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
              <th className="px-5 py-4 text-right font-medium">TOKENS</th>
              <th className="px-5 py-4 text-right font-medium">DURATION</th>
              <th className="px-5 py-4 text-right font-medium">COST</th>
              <th className="px-5 py-4 font-medium">TIME</th>
              <th className="px-5 py-4 text-center font-medium">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-14 text-center text-sm leading-6 text-secondary">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              requests.map((request) => (
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
                    {(() => {
                      const effort = (request.reasoningEffort || "default").toLowerCase();
                      let badgeClass = "bg-cream-2 text-secondary";
                      if (effort.includes("high")) {
                        badgeClass = "bg-coral/10 text-coral";
                      } else if (effort.includes("medium")) {
                        badgeClass = "bg-[#E4A853]/15 text-[#b27926]";
                      } else if (effort.includes("low")) {
                        badgeClass = "bg-[#6B9A7C]/15 text-[#426a50]";
                      }
                      return (
                        <span className={`inline-flex items-center rounded-md px-2.5 py-1 font-mono text-[11px] font-semibold ${badgeClass}`}>
                          {request.reasoningEffort || "default"}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-[13px] tabular-nums text-primary">
                    <span className="font-bold">{formatCompactToken(request.totalTokens)}</span>
                    <span className="text-secondary/70 text-[11px] ml-1.5 font-normal">
                      (In: {formatCompactToken(request.inputTokens ?? 0)} / Out: {formatCompactToken(request.outputTokens ?? 0)})
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-[13px] tabular-nums text-secondary">
                    {request.latencyMs ? `${(request.latencyMs / 1000).toFixed(2)}s` : "0.00s"}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-[13px] font-medium tabular-nums text-coral">
                    {formatUsd(request.costUsd)}
                  </td>
                  <td className="px-5 py-4 font-mono text-[13px] text-secondary">
                    {formatDateTime(request.createdAt)}
                  </td>
                  <td className="px-5 py-4 text-center">
                    {(() => {
                      const code = request.statusCode ?? 200;
                      const is4xx = code >= 400 && code < 500;
                      const is5xx = code >= 500;
                      
                      let badgeClass = "bg-[#5A8A6B]/10 text-[#5A8A6B]";
                      let dotClass = "bg-[#5A8A6B]";
                      let text = "200";

                      if (is4xx) {
                        badgeClass = "bg-coral/10 text-coral";
                        dotClass = "bg-coral";
                        text = String(code);
                      } else if (is5xx) {
                        badgeClass = "bg-primary/10 text-primary";
                        dotClass = "bg-primary";
                        text = String(code);
                      }

                      return (
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold ${badgeClass}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
                          {text}
                        </span>
                      );
                    })()}
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
