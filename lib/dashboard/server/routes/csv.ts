import { VISIBLE_COLUMNS } from '../../config/columns';
import type { UsageEventDto } from '../upstream/types';
import { pickColumns } from './columns';

function escapeCsv(value: string | number | null): string {
  if (value === null) {
    return '';
  }

  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function eventsToCsv(
  rows: UsageEventDto[],
  visibleColumns: readonly string[] = VISIBLE_COLUMNS
): string {
  const visibleRows = pickColumns(rows, visibleColumns);
  const lines = [
    visibleColumns.map(escapeCsv).join(','),
    ...visibleRows.map((row) => visibleColumns.map((column) => escapeCsv(row[column] ?? null)).join(',')),
  ];

  return `\uFEFF${lines.join('\r\n')}\r\n`;
}
