"use client";

import { Key, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import type { ApiKeyStatus } from "@/lib/keys/types";
import { CopyButton } from "@/components/dashboard/CopyButton";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { formatRefreshMeta, maskApiKey } from "@/lib/dashboard-utils";

type KeyStatusCardProps = {
  apiKey: string;
  data: ApiKeyStatus;
  fetchedAt?: string;
  isRefreshing?: boolean;
  onCopied: (message: string) => void;
  onRefresh: () => void;
};

export function KeyStatusCard({ apiKey, data, fetchedAt, isRefreshing = false, onCopied, onRefresh }: KeyStatusCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-[var(--border-subtle)] bg-cream p-6 shadow-md sm:p-10"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-coral/25 bg-coral/10 text-coral">
            <Key className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-secondary">API KEY</span>
              <StatusBadge kind="key" value={data.status || "ACTIVE"} />
            </div>
            <div className="mt-3 flex min-w-0 items-center gap-3">
              <p className="text-mono min-w-0 break-all font-mono text-[clamp(18px,2vw,22px)] font-medium tracking-[0.01em] text-primary">
                {maskApiKey(data.prefix)}
              </p>
              <CopyButton value={apiKey} onCopied={onCopied} />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="group inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-cream-2/45 px-4 py-2 font-mono text-[11px] text-secondary shadow-sm transition hover:border-coral/50 hover:text-coral"
        >
          <RefreshCw className={`h-3.5 w-3.5 transition duration-500 group-hover:rotate-180 ${isRefreshing ? "animate-spin text-coral" : ""}`} />
          {formatRefreshMeta(fetchedAt)}
        </button>
      </div>
    </motion.article>
  );
}
