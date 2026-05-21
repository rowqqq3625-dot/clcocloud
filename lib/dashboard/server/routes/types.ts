import type { OperatorSession } from '../../types/session';
import type { KeyContext } from '../keys/registry';
import type { AccountKeyDto, UsageEventDto, UsageRange } from '../upstream/types';

export type RangePreset = 'today' | '7d' | '30d';

export interface CustomRange {
  startDate: string;
  endDate: string;
  timezone?: string;
}

export type LookupRange = RangePreset | CustomRange;

export interface RouteRequest {
  method: string;
  path: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
}

export interface RouteResponse {
  status: number;
  headers: Record<string, string>;
  body?: unknown;
}

export interface CsvRouteResponse extends RouteResponse {
  body: string;
}

export interface SummaryResponseBody {
  requests: number;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  actualCostUsd?: number;
  avgLatencyMs: number;
  credit: CreditSummary;
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

export interface AipRouteDeps {
  getOperatorSession: () => Promise<OperatorSession>;
  getProxyMode: () => 'operator' | 'direct';
  resolveUserKey: (plaintextKey: string, session?: OperatorSession) => Promise<KeyContext>;
  fetchUsageEventsAll: (
    session: OperatorSession,
    range: UsageRange,
    keyFilter?: string
  ) => AsyncIterable<UsageEventDto>;
  fetchDirectUsageEventsAll: (
    plaintextKey: string,
    range: UsageRange
  ) => AsyncIterable<UsageEventDto>;
  listAccountKeys: (session: OperatorSession) => Promise<AccountKeyDto[]>;
  logAudit: (entry: {
    requestId: string;
    ts: string;
    ip: string;
    fp16: string;
    range: string;
    rowCount: number;
    latencyMs: number;
  }) => void;
  alertSecurity: (message: string) => Promise<void>;
}

export interface AipDashboardRouter {
  handle(request: RouteRequest): Promise<RouteResponse>;
}

export interface MountableApp {
  get?: (path: string, handler: (req: unknown, res: unknown) => void | Promise<void>) => void;
  post?: (path: string, handler: (req: unknown, res: unknown) => void | Promise<void>) => void;
}
