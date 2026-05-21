"use client";

import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideTab, setGuideTab] = useState<"macOS" | "PowerShell" | "CMD" | "Linux">("macOS");

  const cliInstallCode = "npm install -g @anthropic-ai/claude-code";
  
  const envCodes = {
    macOS: `sed -i '' '/export ANTHROPIC_API_KEY/d' ~/.zshrc
echo 'export ANTHROPIC_BASE_URL="https://api-anthropic.com/v1"' >> ~/.zshrc
echo 'export ANTHROPIC_AUTH_TOKEN="${apiKey}"' >> ~/.zshrc
echo 'export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC="1"' >> ~/.zshrc
unset ANTHROPIC_API_KEY
source ~/.zshrc
claude /logout`,

    PowerShell: `[Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", "https://api-anthropic.com/v1", "User")
[Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", "${apiKey}", "User")
[Environment]::SetEnvironmentVariable("CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC", "1", "User")
Remove-Item Env:\\ANTHROPIC_API_KEY -ErrorAction SilentlyContinue

$env:ANTHROPIC_BASE_URL="https://api-anthropic.com/v1"
$env:ANTHROPIC_AUTH_TOKEN="${apiKey}"
$env:CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC="1"
Remove-Item Env:\\ANTHROPIC_API_KEY -ErrorAction SilentlyContinue
claude /logout`,

    CMD: `setx ANTHROPIC_BASE_URL "https://api-anthropic.com/v1"
setx ANTHROPIC_AUTH_TOKEN "${apiKey}"
setx CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC "1"
reg delete "HKCU\\Environment" /v ANTHROPIC_API_KEY /f 2>nul`,

    Linux: `sed -i '/export ANTHROPIC_API_KEY/d' ~/.bashrc
echo 'export ANTHROPIC_BASE_URL="https://api-anthropic.com/v1"' >> ~/.bashrc
echo 'export ANTHROPIC_AUTH_TOKEN="${apiKey}"' >> ~/.bashrc
echo 'export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC="1"' >> ~/.bashrc
unset ANTHROPIC_API_KEY
source ~/.bashrc
claude /logout`
  };

  const { basePath } = useAipContext();
  const events = useAipEvents(apiKey, range, page);

  const data = events.data ? adaptStats(events.data, null, apiKey) : null;
  const fetchedAt = events.updatedAt ? events.updatedAt.toISOString() : undefined;
  const isLoading = events.loading;
  const isSyncing = events.data?.syncing === true;

  useEffect(() => {
    if (data && typeof data.balanceUsd === 'number' && data.balanceUsd < 1) {
      setShowLowBalanceModal(true);
    } else {
      setShowLowBalanceModal(false);
    }
  }, [data?.balanceUsd]);

  // Automatically refresh/refetch when period range changes
  useEffect(() => {
    const triggerAutoRefresh = async () => {
      setIsRefreshing(true);
      try {
        await events.refetch(true);
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

  const totalPages = Math.min(3, Math.max(1, Math.ceil((events.data?.total ?? 0) / 10)));

  return (
    <>
      <Toast message={toast} />
      
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

      <AnimatePresence>
        {isGuideOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity cursor-pointer" 
              onClick={() => setIsGuideOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-cream shadow-2xl"
            >
              {/* Apple-style window titlebar */}
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-cream-2/45 px-5 py-4">
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsGuideOpen(false)}
                    className="h-3 w-3 rounded-full bg-[#ff5f56] border border-[#e0443e] hover:brightness-75 transition cursor-pointer"
                  />
                  <div className="h-3 w-3 rounded-full bg-[#ffbd2e] border border-[#dfa223]" />
                  <div className="h-3 w-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
                </div>
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-secondary">
                  CLI 설치 및 환경 변수 설정
                </span>
                <div className="w-14" />
              </div>

              <div className="p-6 md:p-8 space-y-6">
                {/* 1. CLI 설치 */}
                <div>
                  <h4 className="text-[15px] font-bold text-primary tracking-[-0.01em]">CLI 설치</h4>
                  <div className="relative mt-2.5 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[#1d1b18] font-mono text-[13px] text-cream">
                    <div className="flex items-center justify-between bg-[#2d2a25] px-4 py-2 border-b border-[#3c3933]">
                      <span className="text-secondary/60 text-[11px] font-mono">BASH</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(cliInstallCode);
                          showToast("CLI 설치 코드가 복사되었습니다.");
                        }}
                        className="text-[11px] text-coral hover:text-coral-hi font-semibold"
                      >
                        복사
                      </button>
                    </div>
                    <pre className="p-4 overflow-x-auto whitespace-pre font-mono leading-[1.6]">
                      <code className="text-[#a9ffaf] font-mono"><span className="text-secondary/30 select-none mr-3">1</span>{cliInstallCode}</code>
                    </pre>
                  </div>
                </div>

                {/* 2. 환경 변수 설정 */}
                <div>
                  <h4 className="text-[15px] font-bold text-primary tracking-[-0.01em]">환경 변수 설정</h4>
                  
                  {/* Tabs */}
                  <div className="mt-3 flex flex-wrap gap-1 rounded-xl border border-[var(--border-subtle)] bg-cream-2/45 p-1">
                    {(["macOS", "PowerShell", "CMD", "Linux"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setGuideTab(tab)}
                        className={`flex-1 rounded-lg py-1.5 text-center font-sans text-[12px] font-semibold transition cursor-pointer ${
                          guideTab === tab
                            ? "bg-cream text-coral shadow-sm border border-[var(--border-subtle)]"
                            : "text-secondary hover:text-primary"
                        }`}
                      >
                        {tab === "PowerShell" ? "Windows PowerShell" : tab === "CMD" ? "Windows CMD" : tab}
                      </button>
                    ))}
                  </div>

                  {/* Terminal Card */}
                  <div className="relative mt-3 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[#1d1b18] font-mono text-[13px] text-cream">
                    {/* Header */}
                    <div className="flex items-center justify-between bg-[#2d2a25] px-4 py-2 border-b border-[#3c3933]">
                      <span className="text-secondary/60 text-[11px] font-mono">
                        {guideTab === "CMD" ? "CMD" : "BASH"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(envCodes[guideTab]);
                          showToast("환경 변수 코드가 복사되었습니다.");
                        }}
                        className="text-[11px] text-coral hover:text-coral-hi font-semibold"
                      >
                        복사
                      </button>
                    </div>
                    {/* Shell Lines */}
                    <pre className="p-4 overflow-x-auto whitespace-pre font-mono leading-[1.6] text-left">
                      <code className="font-mono text-[#f8f8f2]">
                        {envCodes[guideTab].split("\n").map((line, index) => {
                          let lineClass = "text-[#f8f8f2]";
                          if (line.includes("export ANTHROPIC_AUTH_TOKEN") || line.includes("SetEnvironmentVariable(\"ANTHROPIC_AUTH_TOKEN\"") || line.includes("setx ANTHROPIC_AUTH_TOKEN")) {
                            lineClass = "text-[#ff79c6]"; // highlight key line
                          } else if (line.startsWith("#")) {
                            lineClass = "text-[#6272a4]";
                          }
                          return (
                            <div key={index} className="flex gap-4">
                              <span className="w-4 select-none text-secondary/30 text-right font-mono">{index + 1}</span>
                              <span className={`${lineClass} font-mono break-all whitespace-pre-wrap`}>{line}</span>
                            </div>
                          );
                        })}
                      </code>
                    </pre>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="mt-8 flex items-center justify-between border-t border-[rgba(232,224,210,0.55)] pt-5">
                  <a
                    href="/docs/installation"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-sans text-[11px] font-semibold text-secondary/50 hover:text-coral transition underline"
                  >
                    자세히 보기
                  </a>
                  <button
                    type="button"
                    onClick={() => setIsGuideOpen(false)}
                    className="rounded-xl border border-[var(--border-subtle)] bg-cream px-5 py-2.5 font-sans text-[13px] font-semibold text-secondary transition hover:bg-cream-2 hover:text-primary shadow-sm cursor-pointer"
                  >
                    닫기
                  </button>
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
          onOpenGuide={() => setIsGuideOpen(true)}
        />

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

        <UsageChart requests={data.recentRequests} onRefresh={refresh} isRefreshing={isRefreshing || isSyncing} />

        <div className="grid gap-3">
          <RecentRequestsTable requests={data.recentRequests} />

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

