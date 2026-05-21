'use client';

import React from 'react';
import type { SummaryBody } from './context/types';
import { formatBalance, formatCompactNumber, formatMoney, formatPercent, formatTokenNumber } from './format';

export function UsageHeaderCards({ summary, syncing }: { summary: SummaryBody; syncing?: boolean }) {
  const totalTokens = summary.tokensIn + summary.tokensOut;
  const credit = summary.credit;
  const percent = credit.percentUsed;

  return (
    <div className={syncing ? 'aip-summary aip-summary-syncing' : 'aip-summary'} aria-live="polite">
      <div className="aip-metrics">
        <Metric label="남은 잔액" value={formatBalance(credit.remainingUsd)} />
        <Metric label="사용한 금액" value={money(credit.usedUsd ?? summary.actualCostUsd ?? summary.costUsd, 3)} />
        <DualMetric
          label="잔액 기준"
          primaryLabel="기준"
          primaryValue={formatBalance(credit.baselineUsd)}
          secondaryLabel="최초"
          secondaryValue={formatBalance(credit.initialUsd)}
        />
        <DualMetric
          label="사용량"
          primaryLabel="토큰"
          primaryValue={formatTokenNumber(totalTokens)}
          secondaryLabel="요청"
          secondaryValue={formatCompactNumber(summary.requests, 0)}
        />
      </div>
      <div className="aip-panel aip-credit-panel">
        <div className="aip-credit-row">
          <span>사용률</span>
          <strong>{formatPercent(percent)}</strong>
        </div>
        <div className="aip-credit-bar" aria-hidden="true">
          <div
            className="aip-credit-fill"
            style={{ width: `${Math.min(Math.max(percent ?? 0, 0), 100)}%` }}
          />
        </div>
        <div className="aip-credit-meta">
          <span>총 한도 {money(credit.limitUsd)}</span>
          <span>기준 잔액 {formatBalance(credit.baselineUsd)}</span>
          <span>최초 잔액 {formatBalance(credit.initialUsd)}</span>
          <span>마지막 사용 {credit.lastUsedAt ?? '확인 불가'}</span>
          <span>상태 {credit.status ?? '확인 불가'}</span>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="aip-panel aip-metric">
      <p className="aip-metric-label">{label}</p>
      <p className="aip-metric-value">{value}</p>
    </div>
  );
}

function DualMetric({
  label,
  primaryLabel,
  primaryValue,
  secondaryLabel,
  secondaryValue,
}: {
  label: string;
  primaryLabel: string;
  primaryValue: string;
  secondaryLabel: string;
  secondaryValue: string;
}) {
  return (
    <div className="aip-panel aip-metric aip-metric-dual">
      <p className="aip-metric-label">{label}</p>
      <div className="aip-dual-lines">
        <div>
          <span>{primaryLabel}</span>
          <strong>{primaryValue}</strong>
        </div>
        <div>
          <span>{secondaryLabel}</span>
          <strong>{secondaryValue}</strong>
        </div>
      </div>
    </div>
  );
}

function money(value: number | null | undefined, fractionDigits = 2): string {
  return formatMoney(value, fractionDigits);
}
