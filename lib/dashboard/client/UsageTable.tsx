'use client';

import React, { useMemo, useState } from 'react';
import { VISIBLE_COLUMNS } from '../config/columns';
import { LiveIndicator } from './LiveIndicator';
import type { EventsBody } from './context/types';
import { formatCellValue } from './format';

type SortDirection = 'asc' | 'desc';

export function UsageTable({
  events,
  updatedAt,
  syncing,
  page,
  onPageChange,
}: {
  events: EventsBody;
  updatedAt: Date | null;
  syncing?: boolean;
  page: number;
  onPageChange: (page: number) => void;
}) {
  const [sortColumn, setSortColumn] = useState<string>('시간');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const virtualized = events.rows.length > 200;
  const maxPage = Math.min(3, Math.max(1, Math.ceil(events.total / Math.max(1, events.pageSize))));

  const rows = useMemo(() => {
    const next = [...events.rows];
    next.sort((a, b) => {
      const left = String(a[sortColumn] ?? '');
      const right = String(b[sortColumn] ?? '');
      return sortDirection === 'asc' ? left.localeCompare(right) : right.localeCompare(left);
    });
    return virtualized ? next.slice(0, 200) : next;
  }, [events.rows, sortColumn, sortDirection, virtualized]);

  function sort(column: string): void {
    if (column === sortColumn) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortColumn(column);
    setSortDirection('asc');
  }

  return (
    <div className="aip-panel aip-table-panel">
      <div className="aip-table-header">
        <div>
          <h2 className="aip-table-title">최근 요청 내역</h2>
          <p className="aip-table-subtitle">요청 1건당 1줄로 최근 30건까지 확인합니다</p>
        </div>
        <LiveIndicator updatedAt={updatedAt} syncing={syncing} />
      </div>
      <div className="aip-table-wrap">
        <table className="aip-table">
          <thead>
            <tr>
              {VISIBLE_COLUMNS.map((column) => (
                <th key={column} scope="col">
                  <button className="aip-table-sort" type="button" onClick={() => sort(column)}>
                    {column}
                    {sortColumn === column ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.rows.length === 0 && (
              <tr>
                <td className="aip-empty" colSpan={VISIBLE_COLUMNS.length}>
                  아직 표시할 사용 기록이 없습니다
                </td>
              </tr>
            )}
            {rows.map((row, index) => (
              <tr key={index}>
                {VISIBLE_COLUMNS.map((column) => (
                  <td key={column}>{formatCellValue(column, row[column])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="aip-pagination" aria-label="사용 내역 페이지">
        <button className="aip-button" type="button" onClick={() => onPageChange(1)} disabled={page === 1}>
          1페이지
        </button>
        <button className="aip-button" type="button" onClick={() => onPageChange(2)} disabled={page === 2 || maxPage < 2}>
          2페이지
        </button>
        <button className="aip-button" type="button" onClick={() => onPageChange(3)} disabled={page === 3 || maxPage < 3}>
          3페이지
        </button>
      </div>
    </div>
  );
}
