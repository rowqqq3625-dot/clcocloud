import { VISIBLE_COLUMNS } from '../../config/columns';
import type { UsageEventDto } from '../upstream/types';

export type VisibleRow = Record<string, string | number | null>;

const columnResolvers: Record<string, (row: UsageEventDto) => string | number | null> = {
  모델명: (row) => row.model ?? null,
  추론난이도: (row) => reasoningLabel(row),
  토큰: (row) => row.total_tokens ?? tokenTotal(row),
  비용: (row) => row.actual_cost ?? row.cost ?? null,
  시간: (row) => row.created_at ?? '확인 중',
  처리: (row) => {
    const statusVal = (row as any).status ?? (row as any).statusCode ?? (row as any).status_code ?? '성공';
    if (statusVal === 'success' || statusVal === 200 || statusVal === '200' || statusVal === '성공') {
      return '성공';
    }
    return String(statusVal);
  },
};

function tokenTotal(row: UsageEventDto): number | null {
  const input = row.input_tokens ?? 0;
  const output = row.output_tokens ?? 0;
  const total = input + output;
  return total > 0 ? total : null;
}

function reasoningLabel(row: UsageEventDto): string {
  return String(
    row.reasoningLabel ??
      row.reasoning_effort ??
      row.reasoning ??
      row.thinking ??
      row.difficulty ??
      row.metadata?.reasoning_effort ??
      '기본값'
  );
}

export function pickColumns(
  rows: UsageEventDto[],
  visibleColumns: readonly string[] = VISIBLE_COLUMNS
): VisibleRow[] {
  return rows.map((row) => {
    const visible: VisibleRow = {};

    for (const column of visibleColumns) {
      const resolve = columnResolvers[column];
      if (resolve !== undefined) {
        visible[column] = resolve(row);
      }
    }

    return visible;
  });
}
