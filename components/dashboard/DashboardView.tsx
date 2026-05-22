"use client";

import { AlertCircle, BookOpen } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAipEvents } from "@/lib/dashboard/client/context/useAipData";
import { useAipContext } from "@/lib/dashboard/client/context/AipContext";
import { adaptStats } from "@/lib/dashboard/adapters";
import { joinPath } from "@/lib/dashboard/client/context/api";
import type { RangeValue } from "@/lib/dashboard/client/context/types";
import { KeyStatusCard } from "@/components/dashboard/KeyStatusCard";
import { RecentRequestsTable, formatCompactToken } from "@/components/dashboard/RecentRequestsTable";
import { Toast } from "@/components/dashboard/Toast";
import { UsageChart } from "@/components/dashboard/UsageChart";
import { DashboardGuideModal } from "@/components/dashboard/DashboardGuideModal";

type DashboardViewProps = {
  apiKey: string;
};

export function DashboardView({ apiKey }: DashboardViewProps) {
  const [range, setRange] = useState<RangeValue>("7d");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLowBalanceModal, setShowLowBalanceModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const { basePath } = useAipContext();
  const events = useAipEvents(apiKey, range, page);
  const eventsData = events.data;
  const eventTotal = eventsData?.total ?? 0;
  const eventRefetchRef = useRef(events.refetch);

  const data = useMemo(() => {
    return eventsData ? adaptStats(eventsData, null, apiKey) : null;
  }, [apiKey, eventsData]);
  const fetchedAt = events.updatedAt ? events.updatedAt.toISOString() : undefined;
  const isLoading = events.loading;
  const isSyncing = eventsData?.syncing === true;
  const dataState = eventsData?.dataState ?? ((data?.recentRequests?.length ?? 0) > 0 ? "ready" : "empty");
  const balanceUsd = data?.balanceUsd;

  useEffect(() => {
    eventRefetchRef.current = events.refetch;
  }, [events.refetch]);

  useEffect(() => {
    if (typeof balanceUsd === 'number' && balanceUsd < 1) {
      setShowLowBalanceModal(true);
    } else {
      setShowLowBalanceModal(false);
    }
  }, [balanceUsd]);

  useEffect(() => {
    setPage((current) => Math.min(current, 3));
  }, [eventTotal]);

  // Automatically refresh/refetch when period range changes
  useEffect(() => {
    const triggerAutoRefresh = async () => {
      setIsRefreshing(true);
      try {
        await eventRefetchRef.current(true);
      } catch (e) {
        console.error(e);
      } finally {
        setIsRefreshing(false);
      }
    };
    triggerAutoRefresh();
  }, [range]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2000);
  };

  const refresh = async () => {
    setIsRefreshing(true);
    await events.refetch(true);
    window.setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleExportCsv = async () => {
    if (exporting) return;
    try {
      setExporting(true);
      const response = await fetch(joinPath(basePath, "/lookup/export"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, range }),
      });
      if (!response.ok) {
        showToast("CSV 다운로드 실패");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const lastFour = apiKey.slice(-4);
      link.download = `clcocloud-usage-${range}-${lastFour}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("CSV 다운로드 완료");
    } catch (err) {
      showToast("CSV 다운로드 중 오류 발생");
    } finally {
      setExporting(false);
    }
  };

  if (events.error) {
    const errorMsg = events.error.includes("Invalid API Key") || events.error.includes("401")
      ? "유효하지 않은 API 키입니다."
      : events.error.includes("Low Balance") || events.error.includes("402")
        ? "잔액이 부족합니다."
        : events.error.includes("Too Many Requests") || events.error.includes("429")
          ? "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요."
          : "데이터를 불러오는 중 오류가 발생했습니다.";

    return (
      <div className="rounded-2xl border border-coral/25 bg-cream p-10 text-center shadow-md">
        <AlertCircle className="mx-auto mb-4 h-10 w-10 text-coral" />
        <h3 className="text-xl font-semibold text-primary">조회 실패</h3>
        <p className="mt-2 text-sm text-secondary">{errorMsg}</p>
      </div>
    );
  }

  if (isLoading && !events.data) {
    return (
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-cream p-8 shadow-md">
        <div className="h-px w-full overflow-hidden bg-cream-2">
          <span className="block h-full animate-dashboard-progress bg-coral" />
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-36 animate-pulse rounded-2xl bg-cream-2" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const totalPages = Math.min(3, Math.max(1, Math.ceil(eventTotal / 10)));

  return (
    <>
      <Toast message={toast} />
      <DashboardGuideModal
        apiKey={apiKey}
        open={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onCopied={showToast}
      />
      
      <AnimatePresence>
        {showLowBalanceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity cursor-pointer" 
              onClick={() => setShowLowBalanceModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-coral/20 bg-cream p-8 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-coral/10 text-coral">
                  <AlertCircle className="h-8 w-8" />
                </div>
                
                <h3 className="mt-5 text-xl font-bold tracking-[-0.015em] text-primary">잔액이 부족합니다</h3>
                <p className="mt-3 text-sm leading-[1.6] text-secondary">
                  안정적인 API 서비스 이용을 위해 잔액 충전이 필요합니다. 아래 충전하기 버튼을 통해 즉시 충전하여 연동을 유지해 보세요.
                </p>
                
                <div className="mt-5 w-full rounded-xl bg-cream-2/45 p-4 border border-[var(--border-subtle)] text-left font-mono text-[13px]">
                  <div className="flex justify-between py-1">
                    <span className="text-secondary/70">현재 사용가능 잔액</span>
                    <span className="font-bold text-coral">${data?.balanceUsd.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-t border-[rgba(232,224,210,0.55)] mt-1.5 pt-1.5">
                    <span className="text-secondary/70 font-sans">기준 충전 단위</span>
                    <span className="font-sans font-semibold text-primary">클코클라우드 플랜 기준</span>
                  </div>
                </div>

                <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setShowLowBalanceModal(false)}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-cream py-3 text-sm font-semibold text-secondary transition hover:bg-cream-2"
                  >
                    닫기
                  </button>
                  <a
                    href="https://clcocloud.kr/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full rounded-xl bg-coral py-3 text-sm font-semibold text-cream shadow-md transition hover:bg-coral-hi text-center flex items-center justify-center"
                  >
                    잔액 충전하기 →
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="grid gap-6"
      >
        <KeyStatusCard
          apiKey={apiKey}
          data={data}
          fetchedAt={fetchedAt}
          isRefreshing={isRefreshing || isSyncing}
          onCopied={showToast}
          onRefresh={refresh}
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-cream px-4 text-sm font-bold text-primary shadow-sm transition hover:border-coral/50 hover:text-coral"
          >
            <BookOpen size={15} />
            가이드
          </button>
        </div>

        {dataState !== "ready" ? (
          <div className={`rounded-2xl border p-5 text-sm leading-6 shadow-sm ${
            dataState === "unavailable"
              ? "border-coral/25 bg-coral/10 text-primary"
              : "border-[var(--border-subtle)] bg-cream text-secondary"
          }`}>
            {dataState === "unavailable"
              ? "실제 요청 로그를 upstream에서 확인하지 못했습니다. 가짜 데이터는 표시하지 않습니다."
              : "이 키로 확인된 실제 요청이 아직 없습니다."}
          </div>
        ) : null}

        {/* Dynamic & Beautiful Cinematic Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--border-subtle)] bg-cream p-5 shadow-md">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral/75">· PERIOD</span>
            <div className="relative">
              <select
                value={range}
                onChange={(e) => {
                  setRange(e.target.value as RangeValue);
                  setPage(1);
                }}
                className="appearance-none rounded-xl border border-[var(--border-subtle)] bg-cream-2/45 px-4 py-2 font-mono text-[13px] text-primary outline-none transition focus:border-coral/50 cursor-pointer pr-8"
              >
                <option value="today">오늘</option>
                <option value="7d">이번 주</option>
                <option value="30d">이번 달</option>
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-secondary text-[10px]">▼</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isSyncing && (
              <div className="flex items-center gap-2 font-mono text-[11px] text-secondary">
                <span className="block h-2 w-2 animate-pulse rounded-full bg-coral" />
                실시간 동기화 중
              </div>
            )}
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={exporting || isLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-cream-2/45 px-4 py-2.5 font-mono text-[12px] font-semibold text-primary transition hover:border-coral/50 hover:text-coral disabled:opacity-50 shadow-sm"
            >
              {exporting ? "다운로드 중..." : "CSV 내보내기"}
            </button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* 1. 사용가능 잔액 Card */}
          <motion.article
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ delay: 0.05, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="group relative flex flex-col justify-between min-h-[220px] overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-cream p-7 shadow-md transition duration-200 hover:-translate-y-0.5 hover:border-coral/50 hover:shadow-lg"
          >
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral/75">· BALANCE</span>
              <h4 className="mt-1 text-[13px] font-semibold text-secondary">사용가능 잔액</h4>
              <div className="mt-4 flex items-baseline text-[clamp(32px,3.5vw,42px)] font-bold leading-none tracking-[-0.025em] text-primary">
                ${data.balanceUsd.toFixed(2)}
              </div>
            </div>
            
            <div className="mt-5 border-t border-[rgba(232,224,210,0.55)] pt-4 text-[12px] text-secondary grid grid-cols-3 gap-2">
              <div>
                <span className="block font-mono text-[10px] text-secondary/60">최초 잔액</span>
                <span className="font-semibold text-primary font-mono">${typeof data.initialUsd === 'number' ? data.initialUsd.toFixed(2) : '-'}</span>
              </div>
              <div>
                <span className="block font-mono text-[10px] text-secondary/60">기준 잔액</span>
                <span className="font-semibold text-primary font-mono">${typeof data.baselineUsd === 'number' ? data.baselineUsd.toFixed(2) : '-'}</span>
              </div>
              <div>
                <span className="block font-mono text-[10px] text-secondary/60">사용 금액</span>
                <span className="font-semibold text-coral font-mono">${typeof data.usedUsd === 'number' ? data.usedUsd.toFixed(3) : '0.000'}</span>
              </div>
            </div>
            <span className="absolute right-5 top-5 h-px w-12 bg-coral/20 transition group-hover:bg-coral/50" />
            <span className="absolute -right-10 -top-10 h-32 w-32 rounded-full border border-coral/10" />
          </motion.article>

          {/* 2. 총 사용 토큰 Card */}
          <motion.article
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ delay: 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="group relative flex flex-col justify-between min-h-[220px] overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-cream p-7 shadow-md transition duration-200 hover:-translate-y-0.5 hover:border-coral/50 hover:shadow-lg"
          >
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral/75">· TOTAL TOKENS</span>
              <h4 className="mt-1 text-[13px] font-semibold text-secondary">총 사용 토큰</h4>
              <div className="mt-4 flex items-baseline text-[clamp(32px,3.5vw,42px)] font-bold leading-none tracking-[-0.025em] text-primary">
                {formatCompactToken(data.stats?.totalTokens ?? 0)}
                <span className="ml-1.5 font-mono text-[13px] font-semibold uppercase tracking-[0.1em] text-secondary">TOKENS</span>
              </div>
            </div>
            <p className="mt-5 border-t border-[rgba(232,224,210,0.55)] pt-4 text-[13px] leading-[1.6] text-secondary">
              선택한 조회 기간 동안 모델 추론에 소비된 전체 토큰 수(입력 + 출력)입니다.
            </p>
            <span className="absolute right-5 top-5 h-px w-12 bg-coral/20 transition group-hover:bg-coral/50" />
            <span className="absolute -right-10 -top-10 h-32 w-32 rounded-full border border-coral/10" />
          </motion.article>

          {/* 3. 총 요청 건수 Card */}
          <motion.article
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ delay: 0.25, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="group relative flex flex-col justify-between min-h-[220px] overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-cream p-7 shadow-md transition duration-200 hover:-translate-y-0.5 hover:border-coral/50 hover:shadow-lg"
          >
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral/75">· TOTAL REQUESTS</span>
              <h4 className="mt-1 text-[13px] font-semibold text-secondary">총 요청 건수</h4>
              <div className="mt-4 flex items-baseline text-[clamp(32px,3.5vw,42px)] font-bold leading-none tracking-[-0.025em] text-primary">
                {(data.stats?.totalRequests ?? 0).toLocaleString()}
                <span className="ml-1.5 font-mono text-[13px] font-semibold uppercase tracking-[0.1em] text-secondary">REQ</span>
              </div>
            </div>
            <p className="mt-5 border-t border-[rgba(232,224,210,0.55)] pt-4 text-[13px] leading-[1.6] text-secondary">
              선택한 조회 기간 동안 발생한 누적 API 요청 성공 횟수입니다.
            </p>
            <span className="absolute right-5 top-5 h-px w-12 bg-coral/20 transition group-hover:bg-coral/50" />
            <span className="absolute -right-10 -top-10 h-32 w-32 rounded-full border border-coral/10" />
          </motion.article>
        </div>

        <UsageChart
          requests={data.recentRequests}
          onRefresh={refresh}
          isRefreshing={isRefreshing || isSyncing}
          dataState={dataState}
        />

        <div className="grid gap-3">
          <RecentRequestsTable requests={data.recentRequests} dataState={dataState} />

          {/* Premium Pagination Controls */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-cream px-3.5 font-mono text-[12px] font-semibold text-primary shadow-sm transition hover:border-coral hover:text-coral disabled:opacity-40 disabled:hover:border-[var(--border-subtle)] disabled:hover:text-primary"
              >
                ← 이전
              </button>
              <span className="font-mono text-[12px] text-secondary px-2 select-none">
                페이지 {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-cream px-3.5 font-mono text-[12px] font-semibold text-primary shadow-sm transition hover:border-coral hover:text-coral disabled:opacity-40 disabled:hover:border-[var(--border-subtle)] disabled:hover:text-primary"
              >
                다음 →
              </button>
            </div>
            <p className="font-mono text-[11px] text-secondary/40 select-none">
              Total: {events.data?.total ?? 0} requests
            </p>
          </div>
        </div>

        <p className="justify-self-end font-mono text-[11px] text-secondary/40">dashboard · v0.2</p>
      </motion.div>
    </>
  );
}

