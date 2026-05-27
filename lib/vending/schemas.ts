import { z } from "zod";

const PLAN_CODE = z.string().trim().min(1).max(64).regex(/^[A-Z0-9_]+$/, "plan_code must be uppercase letters/digits/underscore");
const KEY_VALUE = z.string().trim().min(16).max(512).refine((v) => !/\s/.test(v), {
  message: "key must not contain whitespace",
});
const MEMO = z.string().trim().max(500).optional();
const ORDER_NO = z.string().trim().min(1).max(64);
const REASON = z.string().trim().min(4).max(500);
const UUID = z.string().uuid();

// 단건 등록
export const KeyRegisterSchema = z.object({
  plan_code: PLAN_CODE,
  key_value: KEY_VALUE,
  memo: MEMO,
});
export type KeyRegisterInput = z.infer<typeof KeyRegisterSchema>;

// 대량 등록 (텍스트 박스)
export const BulkRegisterSchema = z.object({
  plan_code: PLAN_CODE,
  raw_text: z.string().min(1).max(1_000_000),
  memo: MEMO,
});
export type BulkRegisterInput = z.infer<typeof BulkRegisterSchema>;

// 키 메모/플랜 수정
export const KeyUpdateSchema = z.object({
  memo: MEMO,
  plan_code: PLAN_CODE.optional(),
});
export type KeyUpdateInput = z.infer<typeof KeyUpdateSchema>;

// 폐기
export const RevokeSchema = z.object({
  reason: REASON,
});
export type RevokeInput = z.infer<typeof RevokeSchema>;

// 재발급 — 기존 키를 폐기하고 동일 주문에 신규 키를 발급한다.
export const ReissueSchema = z.object({
  reason: REASON,
  notify_buyer: z.boolean().default(true),
});
export type ReissueInput = z.infer<typeof ReissueSchema>;

// paid_pending_key 주문에 가용 키 1개를 강제 매칭
export const ManualIssueSchema = z.object({
  order_no: ORDER_NO,
  key_id: UUID.optional(), // 미지정 시 자동 픽업
  notify_buyer: z.boolean().default(true),
});
export type ManualIssueInput = z.infer<typeof ManualIssueSchema>;

// 플랜 upsert
export const PlanUpsertSchema = z.object({
  code: PLAN_CODE,
  name_ko: z.string().trim().min(1).max(100),
  price_krw: z.number().int().min(0),
  active: z.boolean().default(true),
});
export type PlanUpsertInput = z.infer<typeof PlanUpsertSchema>;

// 키 목록 필터
export const KeyListQuerySchema = z.object({
  plan_code: PLAN_CODE.optional(),
  status: z.enum(["available", "reserved", "issued", "revoked", "expired"]).optional(),
  search: z.string().trim().max(200).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  sort: z.enum(["created_at", "issued_at", "status"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type KeyListQuery = z.infer<typeof KeyListQuerySchema>;

// 활동 로그 필터
export const LogListQuerySchema = z.object({
  action: z.string().optional(),
  actor: UUID.optional(),
  order_no: ORDER_NO.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(100),
});
export type LogListQuery = z.infer<typeof LogListQuerySchema>;
