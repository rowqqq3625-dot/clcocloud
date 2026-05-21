export type RangeValue = 'today' | '7d' | '30d';

export interface SummaryBody {
  requests: number;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  actualCostUsd?: number;
  avgLatencyMs: number;
  credit: CreditSummary;
}

export interface EventsBody {
  rows: Record<string, string | number | null>[];
  total: number;
  page: number;
  pageSize: number;
  credit?: CreditSummary;
  summary?: Pick<SummaryBody, 'requests' | 'tokensIn' | 'tokensOut' | 'costUsd' | 'actualCostUsd'>;
  syncing?: boolean;
}

export interface CreditSummary {
  remainingUsd: number | null;
  usedUsd: number | null;
  limitUsd: number | null;
  initialUsd: number | null;
  baselineUsd: number | null;
  percentUsed: number | null;
  status: string | null;
  source: string;
  lastUsedAt: string | null;
}

export interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
  };
}

export interface LoadState<T> {
  data: T | null;
  error: string;
  loading: boolean;
  updatedAt: Date | null;
  refetch: (force?: boolean) => Promise<void>;
}
