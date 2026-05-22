import { createHash } from 'crypto';
import { VISIBLE_COLUMNS } from '../../config/columns';
import type { UsageEventDto } from '../upstream/types';

export type VisibleRow = Record<string, string | number | null>;

const columnResolvers: Record<string, (row: UsageEventDto) => string | number | null> = {
  requestId: (row) => requestId(row),
  model: (row) => row.model ?? 'unknown',
  reasoningEffort: (row) => reasoningLabel(row),
  inputTokens: (row) => row.input_tokens ?? 0,
  outputTokens: (row) => row.output_tokens ?? 0,
  totalTokens: (row) => row.total_tokens ?? tokenTotal(row),
  costUsd: (row) => row.actual_cost ?? row.cost ?? 0,
  createdAt: (row) => row.created_at ?? null,
  processing: (row) => requestStatus(row),
};

function tokenTotal(row: UsageEventDto): number {
  return (row.input_tokens ?? 0) + (row.output_tokens ?? 0);
}

function reasoningLabel(row: UsageEventDto): string {
  return String(
    row.reasoningLabel ??
      row.reasoning_effort ??
      row.reasoning ??
      row.thinking ??
      row.difficulty ??
      row.metadata?.reasoning_effort ??
      'default'
  );
}

function requestStatus(row: UsageEventDto): string {
  const record = row as UsageEventDto & Record<string, unknown>;
  const statusVal = record.status ?? record.statusCode ?? record.status_code ?? 'success';
  if (statusVal === 200 || statusVal === '200') {
    return 'success';
  }
  return String(statusVal);
}

function requestId(row: UsageEventDto): string {
  const record = row as UsageEventDto & Record<string, unknown>;
  const explicit = record.request_id ?? record.requestId ?? record.message_id ?? record.messageId ?? record.id;
  if (typeof explicit === 'string' && explicit.trim() !== '') {
    return explicit;
  }
  if (typeof explicit === 'number' && Number.isFinite(explicit)) {
    return String(explicit);
  }
  return createHash('sha256')
    .update(JSON.stringify({
      keyIdentifier: row.keyIdentifier ?? '',
      model: row.model ?? '',
      createdAt: row.created_at ?? '',
      inputTokens: row.input_tokens ?? 0,
      outputTokens: row.output_tokens ?? 0,
      totalTokens: row.total_tokens ?? 0,
      cost: row.actual_cost ?? row.cost ?? 0,
    }))
    .digest('hex');
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
