'use client';

export function formatCompactNumber(value: number, maxFractionDigits = 4): string {
  if (!Number.isFinite(value)) {
    return '확인 불가';
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  }).format(value);
}

export function formatTokenNumber(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '확인 불가';
  }

  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `${Math.round(value / 1_000_000)}M`;
  }
  if (abs >= 1_000) {
    return `${Math.round(value / 1_000)}K`;
  }
  return formatCompactNumber(Math.round(value), 0);
}

export function formatMoney(value: number | null | undefined, fractionDigits = 2): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? `$${new Intl.NumberFormat('en-US', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }).format(value)}`
    : '확인 불가';
}

export function formatBalance(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '확인 불가';
  }
  if (value < 1) {
    return '잔액부족';
  }
  return formatMoney(value, 2);
}

export function formatPercent(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? `${formatCompactNumber(value, 1)}%` : '한도 미확인';
}

export function formatCellValue(column: string, value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (typeof value === 'number') {
    if (column === '비용') {
      return formatMoney(value);
    }
    if (column === '토큰') {
      return formatTokenNumber(value);
    }
    return formatCompactNumber(value, 0);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    const numeric = Number(trimmed.replace(/,/g, ''));
    if (trimmed !== '' && Number.isFinite(numeric) && /^-?\d+(?:,\d{3})*(?:\.\d+)?$|^-?\d+(?:\.\d+)?$/.test(trimmed)) {
      if (column === '비용') {
        return formatMoney(numeric);
      }
      if (column === '토큰') {
        return formatTokenNumber(numeric);
      }
      return formatCompactNumber(numeric, 0);
    }
    if (column === '시간') {
      return formatDateTime(trimmed);
    }
    return value;
  }

  return String(value);
}

function formatDateTime(value: string): string {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    return value;
  }

  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}
