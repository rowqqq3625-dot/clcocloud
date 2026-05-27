// 자판기(Vending) 모듈 공용 타입.
// DB row 와 1:1 대응 — supabase-js 가 untyped 라 여기서 narrowing 한다.

export type VendingKeyStatus =
  | "available"
  | "reserved"
  | "issued"
  | "revoked"
  | "expired";

export type VendingActionType =
  | "KEY_REGISTER"
  | "KEY_BULK_REGISTER"
  | "KEY_UPDATE"
  | "KEY_REVOKE"
  | "KEY_RESERVE"
  | "KEY_ISSUE"
  | "KEY_RELEASE"
  | "KEY_REISSUE"
  | "MANUAL_ISSUE"
  | "PLAN_UPSERT"
  | "KEY_REVEAL";

export type Plan = {
  id: string;
  code: string;
  name_ko: string;
  price_krw: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type KeyRow = {
  id: string;
  plan_id: string | null;
  product_code: string | null;
  key_value: string | null;        // 평문 — 목록 응답에서는 절대 노출 금지
  key_fingerprint: string | null;
  key_preview: string | null;
  status: VendingKeyStatus;
  memo: string | null;
  created_by: string | null;
  reserved_at: string | null;
  reserved_order_id: string | null;
  issued_at: string | null;
  issued_order_no: string | null;
  issued_order_id: string | null;
  revoked_at: string | null;
  revoked_reason: string | null;
  created_at: string;
  updated_at: string;
};

// 목록·상세 API 응답용 — key_value 를 제거한 안전 뷰
export type KeyRowSafe = Omit<KeyRow, "key_value">;

export type ActionLog = {
  id: string;
  actor_admin_id: string | null;
  action: VendingActionType;
  target_key_id: string | null;
  target_order_no: string | null;
  plan_code: string | null;
  before_state: Record<string, unknown>;
  after_state: Record<string, unknown>;
  created_at: string;
};

export type PlanStock = {
  plan_code: string;
  available_count: number;
  reserved_count: number;
  issued_count: number;
  revoked_count: number;
  expired_count: number;
  total_count: number;
};

export type BulkRegisterResult = {
  total: number;
  registered: number;
  duplicates: number;
  failures: Array<{ line: number; key_preview: string; reason: string }>;
};

export function toSafeKeyRow(row: KeyRow): KeyRowSafe {
  const { key_value: _omit, ...safe } = row;
  return safe;
}
