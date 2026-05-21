import type { LookupRange } from './types';
import type { UsageRange } from '../upstream/types';

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function resolveRange(range: LookupRange, now = new Date()): UsageRange {
  if (typeof range === 'object') {
    return {
      startDate: range.startDate,
      endDate: range.endDate,
      timezone: range.timezone ?? 'Asia/Seoul',
    };
  }

  const end = new Date(now);
  const start = new Date(now);

  if (range === 'today') {
    return {
      startDate: formatDate(start),
      endDate: formatDate(end),
      timezone: 'Asia/Seoul',
    };
  }

  start.setUTCDate(start.getUTCDate() - (range === '7d' ? 6 : 29));

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
    timezone: 'Asia/Seoul',
  };
}

export function rangeLabel(range: LookupRange): string {
  if (typeof range === 'string') {
    return range;
  }

  return `${range.startDate}_${range.endDate}`;
}
