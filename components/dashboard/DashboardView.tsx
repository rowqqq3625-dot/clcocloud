"use client";

import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useKeyStatus } from "@/lib/keys/hooks";
import { DASHBOARD_REFRESH_INTERVAL_MS } from "@/lib/dashboard-utils";
import { KeyStatusCard } from "@/components/dashboard/KeyStatusCard";
import { RecentRequestsTable } from "@/components/dashboard/RecentRequestsTable";
import { StatCard } from "@/components/dashboard/StatCard";
import { Toast } from "@/components/dashboard/Toast";
import { UsageChart } from "@/components/dashboard/UsageChart";

type DashboardViewProps = {
  apiKey: string;
};

export function DashboardView({ apiKey }: DashboardViewProps) {
  const { data, error, isLoading, fetchedAt, mutate } = useKeyStatus(apiKey);
  const [toast, setToast] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIsRefreshing(true);
      void mutate().finally(() => window.setTimeout(() => setIsRefreshing(false), 600));
    }, DASHBOARD_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [mutate]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2000);
  };

  const refresh = () => {
    setIsRefreshing(true);
    void mutate().finally(() => window.setTimeout(() => setIsRefreshing(false), 600));
  };

  // 조회 실패 상태도 메인 페이지 톤 안에서 처리한다.
  if (error) {
    const status = (error as Error & { status?: number }).status;
    const errorMessage = status === 401
      ? "유효하지 않은 API 키입니다."
      : status === 402
        ? "잔액이 부족합니다."
        : status === 429
          ? "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요."
          : "데이터를 불러오는 중 오류가 발생했습니다.";

    return (
      <div className="rounded-2xl border border-coral/25 bg-cream p-10 text-center shadow-md">
        <AlertCircle className="mx-auto mb-4 h-10 w-10 text-coral" />
        <h3 className="text-xl font-semibold text-primary">조회 실패</h3>
        <p className="mt-2 text-sm text-secondary">{errorMessage}</p>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-cream p-8 shadow-md">
        <div className="h-px w-full overflow-hidden bg-cream-2"><span className="block h-full animate-dashboard-progress bg-coral" /></div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[0, 1, 2].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl bg-cream-2" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      <Toast message={toast} />
      <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="grid gap-6">
        <KeyStatusCard apiKey={apiKey} data={data} fetchedAt={fetchedAt} isRefreshing={isRefreshing} onCopied={showToast} onRefresh={refresh} />
        <div className="grid gap-5 lg:grid-cols-3">
          <StatCard eyebrow="BALANCE" value={data.balanceUsd ?? 0} currency helper="사용 가능 잔액" delay={0.05} />
          <StatCard eyebrow="SPEND CAP" value={data.monthlySpendCapUsd === null ? "무제한" : data.monthlySpendCapUsd ?? 0} currency={data.monthlySpendCapUsd !== null} italic={data.monthlySpendCapUsd === null} helper={data.monthlySpendCapUsd === null ? "월간 한도 없음" : "월간 지출 한도"} delay={0.15} />
          <StatCard eyebrow="RPM" value={data.rateLimitRpm ?? 0} suffix="REQ/MIN" helper="분당 요청 한도" delay={0.25} />
        </div>
        <UsageChart requests={data.recentRequests} />
        <RecentRequestsTable requests={data.recentRequests} />
        <p className="justify-self-end font-mono text-[11px] text-secondary/40">dashboard · v0.1</p>
      </motion.div>
    </>
  );
}
