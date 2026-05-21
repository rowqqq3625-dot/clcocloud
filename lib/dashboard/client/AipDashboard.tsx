'use client';

import React, { CSSProperties, useEffect, useMemo, useState } from 'react';
import '../theme/default.css';
import './dashboard.css';
import { AipProvider } from './context/AipContext';
import { joinPath } from './context/api';
import { useAipEvents } from './context/useAipData';
import type { RangeValue } from './context/types';
import { ApiKeyInput } from './ApiKeyInput';
import { FiltersBar } from './FiltersBar';
import { UsageHeaderCards } from './UsageHeaderCards';
import { UsageTable } from './UsageTable';
import { UsageGuidePanel } from './UsageGuidePanel';
import type { EventsBody, SummaryBody } from './context/types';

interface AipDashboardProps {
  theme?: CSSProperties;
  basePath: string;
}

const SESSION_KEY = 'gudokpin.dashboard.apiKey';

type KeyPlanLabel = '체험키' | '베이직키' | '플러스키' | '프로키' | '기타키';

interface AdminLowBalanceRecord {
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

export function AipDashboard({ theme, basePath }: AipDashboardProps) {
  const style = useMemo(() => theme ?? {}, [theme]);

  return (
    <AipProvider basePath={basePath}>
      <AipDashboardInner basePath={basePath} style={style} />
    </AipProvider>
  );
}

function AipDashboardInner({ basePath, style }: { basePath: string; style: CSSProperties }) {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [acceptedKey, setAcceptedKey] = useState('');
  const [guideOpen, setGuideOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminRecords, setAdminRecords] = useState<AdminLowBalanceRecord[]>([]);
  const [adminPlanFilter, setAdminPlanFilter] = useState<KeyPlanLabel | '전체'>('전체');
  const [adminSearch, setAdminSearch] = useState('');
  const [dismissedLowBalanceFor, setDismissedLowBalanceFor] = useState('');
  const [range, setRange] = useState<RangeValue>('7d');
  const [page, setPage] = useState(1);
  const events = useAipEvents(acceptedKey, range, page);

  useEffect(() => {
    const remembered = sessionStorage.getItem(SESSION_KEY);
    if (remembered !== null && remembered !== '') {
      setApiKeyInput(remembered);
      setAcceptedKey(remembered);
    }
  }, []);

  const loading = events.loading;
  const syncing = loading || adminLoading || events.data?.syncing === true;
  const lastFour = acceptedKey === '' ? '' : acceptedKey.slice(-4);
  const visibleSummary = events.data === null ? null : summaryFromEvents(events.data);
  const guideKey = acceptedKey === '' ? apiKeyInput.trim() : acceptedKey;
  const lowBalance = isLowBalance(visibleSummary?.credit.remainingUsd);
  const showLowBalanceDialog = acceptedKey !== '' && lowBalance && dismissedLowBalanceFor !== acceptedKey;
  const filteredAdminRecords = adminRecords.filter((record) => {
    const matchesPlan = adminPlanFilter === '전체' || record.plan === adminPlanFilter;
    const keyword = adminSearch.trim().toLowerCase();
    const matchesSearch = keyword === '' ||
      record.keyLabel.toLowerCase().includes(keyword) ||
      record.fp16.toLowerCase().includes(keyword) ||
      record.lastFour.toLowerCase().includes(keyword);
    return matchesPlan && matchesSearch;
  });

  async function submit(): Promise<void> {
    const nextKey = apiKeyInput.trim();
    if (nextKey === '') {
      return;
    }

    if (await tryAdminLogin(nextKey)) {
      return;
    }

    sessionStorage.setItem(SESSION_KEY, nextKey);
    setPage(1);
    setDismissedLowBalanceFor('');
    setAcceptedKey(nextKey);
  }

  function reset(): void {
    setApiKeyInput('');
    setAcceptedKey('');
    setAdminMode(false);
    setAdminRecords([]);
    setAdminPlanFilter('전체');
    setAdminSearch('');
    setPage(1);
    setDismissedLowBalanceFor('');
    sessionStorage.removeItem(SESSION_KEY);
  }

  async function refresh(): Promise<void> {
    await events.refetch();
  }

  async function exportCsv(): Promise<void> {
    if (acceptedKey === '') {
      return;
    }

    try {
      setExporting(true);
      const response = await fetch(joinPath(basePath, '/lookup/export'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: acceptedKey, range }),
      });
      if (!response.ok) {
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gudokpin-usage-${range}-${lastFour}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
    } finally {
      setExporting(false);
    }
  }

  async function tryAdminLogin(code: string): Promise<boolean> {
    try {
      setAdminLoading(true);
      const response = await fetch(joinPath(basePath, '/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ code }),
      });
      if (!response.ok) {
        return false;
      }
      const body = await response.json() as { ok?: boolean };
      if (body.ok !== true) {
        return false;
      }
      sessionStorage.removeItem(SESSION_KEY);
      setApiKeyInput('');
      setAcceptedKey('');
      setPage(1);
      setAdminMode(true);
      await loadAdminRecords();
      return true;
    } catch {
      return false;
    } finally {
      setAdminLoading(false);
    }
  }

  async function loadAdminRecords(): Promise<void> {
    const response = await fetch(joinPath(basePath, '/admin/low-balance'), {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (!response.ok) {
      setAdminMode(false);
      setAdminRecords([]);
      return;
    }
    const body = await response.json() as { ok?: boolean; records?: AdminLowBalanceRecord[] };
    setAdminRecords(Array.isArray(body.records) ? body.records : []);
  }

  async function logoutAdmin(): Promise<void> {
    await fetch(joinPath(basePath, '/admin/logout'), {
      method: 'POST',
      credentials: 'same-origin',
    }).catch(() => undefined);
    setAdminMode(false);
    setAdminRecords([]);
    setAdminPlanFilter('전체');
    setAdminSearch('');
  }

  return (
    <section className="aip-dashboard" style={style}>
      {adminMode ? (
        <div className="aip-shell aip-shell-session">
          <header className="aip-session-header">
            <div>
              <span className="aip-eyebrow">Admin Session</span>
              <h1 className="aip-session-title">관리자 대시보드</h1>
            </div>
            <div className="aip-admin-actions">
              <button className="aip-button aip-button-secondary" type="button" onClick={() => void loadAdminRecords()}>
                새로고침
              </button>
              <button className="aip-button" type="button" onClick={() => void logoutAdmin()}>
                로그아웃
              </button>
            </div>
          </header>

          <section className="aip-panel aip-admin-panel">
            <div className="aip-admin-summary">
              {(['전체', '체험키', '베이직키', '플러스키', '프로키', '기타키'] as Array<KeyPlanLabel | '전체'>).map((plan) => (
                <button
                  key={plan}
                  className={`aip-admin-chip${adminPlanFilter === plan ? ' aip-admin-chip-active' : ''}`}
                  type="button"
                  onClick={() => setAdminPlanFilter(plan)}
                >
                  {plan} {countByPlan(adminRecords, plan)}
                </button>
              ))}
            </div>
            <input
              className="aip-input aip-admin-search"
              type="search"
              value={adminSearch}
              onChange={(event) => setAdminSearch(event.target.value)}
              placeholder="키 이름, fp16, 끝자리 검색"
              autoComplete="off"
            />
            <div className="aip-admin-table" role="table" aria-label="잔액부족 키 목록">
              <div className="aip-admin-row aip-admin-row-head" role="row">
                <span>등급</span>
                <span>키 번호/이름</span>
                <span>식별</span>
                <span>잔액</span>
                <span>기준/최초</span>
                <span>발생 시각</span>
              </div>
              {filteredAdminRecords.length === 0 ? (
                <div className="aip-admin-empty">기록된 잔액부족 키가 없습니다</div>
              ) : filteredAdminRecords.map((record) => (
                <div className="aip-admin-row" role="row" key={`${record.fp16}-${record.occurredAt}`}>
                  <span>{record.plan}</span>
                  <strong>{record.keyLabel}</strong>
                  <span>fp16 {record.fp16}<br />끝자리 {record.lastFour}</span>
                  <span>{formatAdminMoney(record.remainingUsd)}</span>
                  <span>{formatAdminMoney(record.baselineUsd)} / {formatAdminMoney(record.initialUsd)}</span>
                  <span>{formatAdminTime(record.occurredAt)}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : acceptedKey === '' ? (
        <div className="aip-shell aip-shell-intro">
          <header className="aip-header">
            <span className="aip-eyebrow">API Dashboard</span>
            <h1 className="aip-title">구독핀 API대시보드</h1>
            <div className="aip-hero-tiles" aria-hidden="true">
              <span>API KEY LIVE</span>
            </div>
          </header>

          <ApiKeyInput
            value={apiKeyInput}
            loading={loading || adminLoading}
            syncing={syncing}
            onValueChange={setApiKeyInput}
            onSubmit={() => void submit()}
            onGuideOpen={() => setGuideOpen(true)}
          />
        </div>
      ) : (
        <div className="aip-shell aip-shell-session">
          <header className="aip-session-header">
            <div>
              <span className="aip-eyebrow">Live Session</span>
              <h1 className="aip-session-title">사용량 대시보드</h1>
            </div>
            {syncing && (
              <div className="aip-sync-line" aria-live="polite">
                <span className="aip-sync-dot" aria-hidden="true" />
                동기화 중
              </div>
            )}
          </header>

          <FiltersBar
            lastFour={lastFour}
            range={range}
            loading={loading}
            exporting={exporting}
            onRangeChange={(nextRange) => {
              setRange(nextRange);
              setPage(1);
            }}
            onRefresh={() => void refresh()}
            onReset={reset}
            onExport={() => void exportCsv()}
            onGuideOpen={() => setGuideOpen(true)}
          />

          {events.data !== null && visibleSummary !== null ? (
            <>
              <UsageHeaderCards summary={visibleSummary} syncing={syncing} />
              <UsageTable
                events={events.data}
                updatedAt={events.updatedAt}
                syncing={syncing}
                page={page}
                onPageChange={setPage}
              />
            </>
          ) : (
            <div className="aip-panel aip-session-loading" aria-live="polite">
              <span className="aip-sync-dot" aria-hidden="true" />
              <span>대시보드를 준비하고 있습니다</span>
            </div>
          )}
        </div>
      )}
      {showLowBalanceDialog && (
        <div className="aip-modal-backdrop" role="presentation">
          <section className="aip-panel aip-low-balance-dialog" role="dialog" aria-modal="true" aria-labelledby="aip-low-balance-title">
            <button
              className="aip-modal-close"
              type="button"
              aria-label="닫기"
              onClick={() => setDismissedLowBalanceFor(acceptedKey)}
            >
              ×
            </button>
            <p className="aip-eyebrow">Balance</p>
            <h2 id="aip-low-balance-title">잔액이 부족합니다</h2>
            <p>계속 사용하려면 충전이 필요합니다.</p>
            <a className="aip-button aip-button-primary" href="https://www.gudokpin.com/product/claude-api">
              재충전 하러가기
            </a>
          </section>
        </div>
      )}
      <UsageGuidePanel apiKey={guideKey} open={guideOpen} onClose={() => setGuideOpen(false)} />
    </section>
  );
}

function numberValue(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function summaryFromEvents(events: EventsBody): SummaryBody {
  const tokens = events.summary !== undefined
    ? events.summary.tokensIn + events.summary.tokensOut
    : events.rows.reduce((total, row) => total + numberValue(row['토큰']), 0);
  const cost = events.summary?.actualCostUsd ?? events.rows.reduce((total, row) => total + numberValue(row['비용']), 0);

  return {
    requests: events.summary?.requests ?? events.total,
    tokensIn: events.summary?.tokensIn ?? 0,
    tokensOut: events.summary?.tokensOut ?? tokens,
    costUsd: events.summary?.costUsd ?? cost,
    actualCostUsd: events.summary?.actualCostUsd ?? cost,
    avgLatencyMs: 0,
    credit: events.credit ?? {
      remainingUsd: null,
      usedUsd: null,
      limitUsd: null,
      initialUsd: null,
      baselineUsd: null,
      percentUsed: null,
      status: null,
      source: 'events.fallback',
      lastUsedAt: null,
    },
  };
}

function isLowBalance(value: number | null | undefined): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value < 1;
}

function countByPlan(records: AdminLowBalanceRecord[], plan: KeyPlanLabel | '전체'): number {
  return plan === '전체' ? records.length : records.filter((record) => record.plan === plan).length;
}

function formatAdminMoney(value: number | null): string {
  return typeof value === 'number' && Number.isFinite(value) ? `$${value.toFixed(2)}` : '확인 불가';
}

function formatAdminTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '확인 불가';
  }
  return parsed.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
