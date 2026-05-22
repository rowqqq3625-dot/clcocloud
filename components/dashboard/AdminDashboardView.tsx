"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Download, LogOut, RefreshCw, AlertCircle } from "lucide-react";
import { formatDateTime, formatUsd } from "@/lib/format";

export type KeyPlanLabel = "체험키" | "베이직키" | "플러스키" | "프로키" | "기타키";

export interface LowBalanceRecord {
  plan: KeyPlanLabel;
  keyLabel: string;
  fp16: string;
  lastFour: string;
  remainingUsd: number | null;
  initialUsd: number | null;
  baselineUsd: number | null;
  usedUsd: number | null;
  lastUsedAt: string | null;
  occurredAt: string;
}

type AdminDashboardViewProps = {
  onLogout: () => void;
};

export function AdminDashboardView({ onLogout }: AdminDashboardViewProps) {
  const [records, setRecords] = useState<LowBalanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRecords = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/dashboard/aip/admin/low-balance");
      if (!response.ok) {
        if (response.status === 401) {
          onLogout();
          return;
        }
        throw new Error("관리자 데이터를 불러오는데 실패했습니다.");
      }
      const data = await response.json();
      if (data.ok && Array.isArray(data.records)) {
        setRecords(data.records);
      } else {
        setRecords([]);
      }
    } catch (err: any) {
      setError(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchRecords(true);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/dashboard/aip/admin/logout", { method: "POST" });
    } catch (e) {
      // Ignore logout errors and clear state
    }
    onLogout();
  };

  // Filter logic
  const filteredRecords = records.filter((rec) => {
    // 1. Tab filter
    if (activeTab !== "전체" && rec.plan !== activeTab) {
      return false;
    }
    // 2. Text search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const matchLabel = rec.keyLabel?.toLowerCase().includes(query);
      const matchFp = rec.fp16?.toLowerCase().includes(query);
      const matchLastFour = rec.lastFour?.toLowerCase().includes(query);
      return matchLabel || matchFp || matchLastFour;
    }
    return true;
  });

  // Client-side CSV generator
  const handleExportCsv = () => {
    if (filteredRecords.length === 0) return;

    const headers = [
      "키 등급",
      "키 이름",
      "fp16 식별자",
      "끝자리",
      "남은 잔액",
      "최초 잔액",
      "기준 잔액",
      "사용 금액",
      "마지막 사용 시각",
      "잔액부족 감지 일시",
    ];

    const rows = filteredRecords.map((rec) => [
      rec.plan,
      rec.keyLabel,
      rec.fp16,
      rec.lastFour,
      rec.remainingUsd !== null ? `$${rec.remainingUsd.toFixed(4)}` : "-",
      rec.initialUsd !== null ? `$${rec.initialUsd.toFixed(4)}` : "-",
      rec.baselineUsd !== null ? `$${rec.baselineUsd.toFixed(4)}` : "-",
      rec.usedUsd !== null ? `$${rec.usedUsd.toFixed(4)}` : "-",
      rec.lastUsedAt ? formatDateTime(rec.lastUsedAt) : "-",
      formatDateTime(rec.occurredAt),
    ]);

    const csvContent =
      "\uFEFF" + // BOM for Korean Excel encoding
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateStr = new Date().toISOString().split("T")[0];
    link.download = `clcocloud-admin-low-balance-${activeTab}-${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tabs = ["전체", "체험키", "베이직키", "플러스키", "프로키", "기타키"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid gap-6"
    >
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--border-subtle)] bg-cream p-6 shadow-md">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral/75">· ADMIN CONSOLE</span>
          <h2 className="mt-2 text-[26px] font-[680] tracking-[-0.02em] text-primary">잔액 부족 관리자 대시보드</h2>
          <p className="mt-1.5 text-sm text-secondary">
            잔액이 $1 미만으로 감지되어 충전 대기 중인 활성 API 키들을 통합 관리합니다.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-cream transition hover:border-coral/50 hover:text-coral disabled:opacity-50"
            title="새로고침"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-coral" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-coral/25 bg-cream px-4 text-sm font-semibold text-coral transition hover:bg-coral/5 hover:border-coral"
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </button>
        </div>
      </div>

      {/* 2. Control bar (Tabs, Search, Export) */}
      <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-[var(--border-subtle)] bg-cream p-5 shadow-sm">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3.5 py-2 font-semibold text-[13px] transition duration-200 ${
                activeTab === tab
                  ? "bg-coral text-cream shadow-sm"
                  : "bg-cream-2/40 text-secondary hover:bg-cream-2/80 hover:text-primary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search & Export */}
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <div className="relative flex-1 sm:w-64 sm:flex-initial">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary/65" />
            <input
              type="text"
              placeholder="식별값, 끝자리, 키 이름 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-cream-2/30 pl-10 pr-4 text-xs font-medium text-primary shadow-sm outline-none transition focus:border-coral/50 focus:ring-2 focus:ring-coral/5"
            />
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredRecords.length === 0}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-cream px-4 font-mono text-[12px] font-semibold text-primary transition hover:border-coral/50 hover:text-coral disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            CSV 내보내기
          </button>
        </div>
      </div>

      {/* 3. Table or Loading States */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-cream shadow-md overflow-hidden">
        {loading ? (
          <div className="p-20 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-coral border-t-transparent" />
            <p className="mt-4 text-sm text-secondary font-mono">Loading records...</p>
          </div>
        ) : error ? (
          <div className="p-20 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-coral" />
            <p className="mt-4 text-sm font-semibold text-primary">{error}</p>
            <button
              type="button"
              onClick={() => fetchRecords()}
              className="mt-4 rounded-xl bg-coral px-4 py-2 text-xs font-semibold text-cream"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-cream-2/70 font-mono text-[11px] uppercase tracking-[0.12em] text-secondary border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-5 py-4 font-semibold">키 등급</th>
                  <th className="px-5 py-4 font-semibold">키 이름 / 라벨</th>
                  <th className="px-5 py-4 font-semibold">fp16 식별자</th>
                  <th className="px-5 py-4 text-center font-semibold">끝자리</th>
                  <th className="px-5 py-4 text-right font-semibold">남은 잔액</th>
                  <th className="px-5 py-4 text-right font-semibold">최초/기준 잔액</th>
                  <th className="px-5 py-4 text-right font-semibold">사용 금액</th>
                  <th className="px-5 py-4 font-semibold">마지막 사용 시각</th>
                  <th className="px-5 py-4 font-semibold">감지 일시</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(232,224,210,0.45)]">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center text-secondary">
                      {searchQuery ? "검색 결과에 부합하는 레코드가 없습니다." : "잔액 부족이 감지된 활성 키 목록이 비어 있습니다."}
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec, idx) => (
                    <motion.tr
                      key={`${rec.fp16}-${idx}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                      className="group transition duration-150 hover:bg-cream-2/40"
                    >
                      {/* Plan Badge */}
                      <td className="px-5 py-4 font-semibold">
                        <span
                          className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-bold ${
                            rec.plan === "프로키"
                              ? "bg-purple-100 text-purple-800"
                              : rec.plan === "플러스키"
                              ? "bg-blue-100 text-blue-800"
                              : rec.plan === "베이직키"
                              ? "bg-green-100 text-green-800"
                              : rec.plan === "체험키"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {rec.plan}
                        </span>
                      </td>

                      {/* Key Name */}
                      <td className="px-5 py-4 font-medium text-primary">
                        {rec.keyLabel || "-"}
                      </td>

                      {/* fp16 Fingerprint */}
                      <td className="px-5 py-4 font-mono text-[12px] text-secondary">
                        {rec.fp16 || "-"}
                      </td>

                      {/* Last Four */}
                      <td className="px-5 py-4 text-center font-mono text-[12px] text-secondary">
                        {rec.lastFour || "-"}
                      </td>

                      {/* Remaining Balance */}
                      <td className="px-5 py-4 text-right font-mono text-[13px] font-bold text-coral tabular-nums">
                        {rec.remainingUsd !== null ? `$${rec.remainingUsd.toFixed(4)}` : "-"}
                      </td>

                      {/* Initial / Baseline */}
                      <td className="px-5 py-4 text-right font-mono text-[12px] text-secondary tabular-nums">
                        {rec.initialUsd !== null ? `$${rec.initialUsd.toFixed(2)}` : "-"}
                        <span className="mx-1 text-secondary/40">/</span>
                        {rec.baselineUsd !== null ? `$${rec.baselineUsd.toFixed(2)}` : "-"}
                      </td>

                      {/* Used Usd */}
                      <td className="px-5 py-4 text-right font-mono text-[12px] text-secondary tabular-nums">
                        {rec.usedUsd !== null ? `$${rec.usedUsd.toFixed(4)}` : "-"}
                      </td>

                      {/* Last Used At */}
                      <td className="px-5 py-4 font-mono text-[12px] text-secondary">
                        {rec.lastUsedAt ? formatDateTime(rec.lastUsedAt) : "-"}
                      </td>

                      {/* Detected At */}
                      <td className="px-5 py-4 font-mono text-[12px] text-secondary/70">
                        {formatDateTime(rec.occurredAt)}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
