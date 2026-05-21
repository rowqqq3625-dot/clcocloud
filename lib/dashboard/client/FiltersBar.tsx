'use client';

import React from 'react';
import type { RangeValue } from './context/types';

interface FiltersBarProps {
  lastFour: string;
  range: RangeValue;
  loading: boolean;
  exporting?: boolean;
  onRangeChange: (range: RangeValue) => void;
  onRefresh: () => void;
  onReset: () => void;
  onExport: () => void;
  onGuideOpen: () => void;
}

export function FiltersBar({
  lastFour,
  range,
  loading,
  exporting = false,
  onRangeChange,
  onRefresh,
  onReset,
  onExport,
  onGuideOpen,
}: FiltersBarProps) {
  return (
    <div className="aip-panel aip-toolbar">
      <div className="aip-toolbar-left">
        <span className="aip-chip">구독핀 API 키 •••• {lastFour}</span>
        <select
          className="aip-select"
          value={range}
          onChange={(event) => onRangeChange(event.target.value as RangeValue)}
          aria-label="시간 범위"
        >
          <option value="today">오늘</option>
          <option value="7d">최근 7일</option>
          <option value="30d">최근 30일</option>
        </select>
      </div>
      <div className="aip-toolbar-actions">
        <button className="aip-button" type="button" onClick={onRefresh} disabled={loading}>
          새로고침
        </button>
        <button className="aip-button" type="button" onClick={onReset}>
          돌아가기
        </button>
        <button className="aip-button" type="button" onClick={onExport} disabled={loading || exporting}>
          {exporting ? '준비 중' : 'CSV 내보내기'}
        </button>
        <button className="aip-button" type="button" onClick={onGuideOpen}>
          사용법
        </button>
      </div>
    </div>
  );
}
