# API 키 자판기(Vending) 운영자 매뉴얼

CLCOCLOUD 슈퍼관리자 콘솔 `/admin-panel/vending` 모듈 사용 안내.

## 1. 핵심 원칙

- **무인 자판기**: 운영자가 미리 플랜별 API 키를 등록해 두면, 실결제 1건당 정확히 1개의 키가 잠금(SKIP LOCKED) 출고되어 구매자 알림톡으로 발송된다.
- **단일 진실 공급원**: 키 등록·수정·발급·폐기·재고 변경은 모두 `/admin-panel/vending` 안에서만 한다.
- **결제 ↔ 키 1:1 매칭**: 동일 주문에 키 2개 출고 금지(멱등). 결제 실패·취소 시 키 출고 금지. 플랜 불일치(STANDARD 주문에 PRO 키) 자동 차단.

## 2. 화면 구성

| 경로 | 용도 |
|---|---|
| `/admin-panel/vending`            | 대시보드 — 플랜별 재고 카드, 최근 활동, LOW_STOCK / 매칭 대기 / 고아 키 배너 |
| `/admin-panel/vending/keys`       | 키 목록 — 필터(상태/플랜/검색), 등록 모달, 폐기/재발급 |
| `/admin-panel/vending/keys/[id]`  | 상세 — 메타 + 발급 이력 + 관련 주문 + 원문 노출(5초 자동 마스킹) |
| `/admin-panel/vending/logs`       | 활동 로그 — `vending_action_logs` 11종 액션 + before/after JSON diff |
| `/admin-panel/vending/match`      | 수동 매칭 — `paid_pending_key` 주문에 가용 키 강제 출고 + 알림톡 재발송 |
| `/admin-panel/vending/plans`      | 플랜 마스터 — STANDARD/PRO/ULTRA upsert, 비활성 토글 |

## 3. 등록 절차

### 단건 등록
1. 대시보드 또는 키 목록 → **키 등록** 버튼
2. **단건** 탭 → 플랜 선택 → API 키 붙여넣기 → (선택) 메모 입력
3. **등록** 클릭
4. 중복(같은 fingerprint) 시 `duplicate_key` 메시지 표시

### 대량 텍스트
1. **대량 (텍스트)** 탭 → 플랜 선택 → 텍스트 박스에 한 줄당 1키 (최대 500)
2. **대량 등록** 클릭
3. 결과 표: 총/등록/중복/실패 + 실패 행 30개 미리보기

### CSV 업로드
1. **CSV 업로드** 탭 → 파일 드래그드롭 (5MB 한도)
2. 헤더: `plan_code,api_key,memo` (memo 선택)
3. 각 행별로 plan_code → plans.code 매핑 자동 검증
4. 결과 표는 대량 텍스트와 동일

## 4. 재고 운영

- 대시보드 상단 **재고 부족** 배지: `available_count ≤ VENDING_LOW_STOCK_THRESHOLD` (기본 5)
- 임계치는 `.env`의 `VENDING_LOW_STOCK_THRESHOLD` 로 조정
- 결제 시점에 가용 키가 없으면:
  - 구매자 → 알림톡 **발송 안 함**
  - 주문 → `status='paid_pending_key'`
  - 관리자 → BATI ADMIN_LOW_STOCK 알림톡 1회
- 수동 매칭 화면(`/vending/match`)에서 키 등록 후 매칭 버튼 → 구매자 알림톡 재발송

## 5. 폐기 · 재발급

- **폐기 (revoke)**: 상태 `available` 또는 `issued` 키에서 가능. 폐기 시 사유 4자 이상 + 정확 문구 `REVOKE` 입력 필요.
- **재발급 (reissue)**: 발급된 키만 가능. 기존 키 폐기 + 동일 주문에 신규 키 발급 + 알림톡 옵션. 신규 키 재고가 없으면 409 응답.

## 6. 활동 로그

- 11종 액션: `KEY_REGISTER`, `KEY_BULK_REGISTER`, `KEY_UPDATE`, `KEY_REVOKE`, `KEY_RESERVE`, `KEY_ISSUE`, `KEY_RELEASE`, `KEY_REISSUE`, `MANUAL_ISSUE`, `PLAN_UPSERT`, `KEY_REVEAL`
- 모든 로그는 append-only (DB 트리거로 수정·삭제 차단)
- before / after JSON diff 뷰어 — `sk-...` 패턴은 자동 마스킹
- 액션·주문번호로 필터 가능

## 7. 환경변수

```env
VENDING_LOW_STOCK_THRESHOLD=5    # 가용 키 임계치
VENDING_BULK_MAX=500             # 대량 등록 1회 최대 키 수
ADMIN_TOKEN=                     # /api/cron/vending-release 인증 토큰
```

## 8. 예약 타임아웃 복구 (크론)

```
GET /api/cron/vending-release?minutes=15
Authorization: Bearer ${ADMIN_TOKEN}
```

`reserved` 상태로 `minutes` 분 이상 머무는 키를 `available` 로 복구.
Vercel Cron, Supabase pg_cron 등에서 5~15분 간격 호출 권장.

## 9. 검증 시나리오 체크리스트

| # | 시나리오 | 절차 | 기대 결과 |
|---|---|---|---|
| 1  | 키 10개 등록 | 대량 텍스트 등록 | available 카운트 +10 |
| 2  | 중복 등록 | 같은 키 재등록 | 409 duplicate_key |
| 3  | CSV 100건 | 정상 CSV 업로드 | 100건 등록 + 로그 1건(KEY_BULK_REGISTER) |
| 4  | 정상 결제 1건 | 시뮬레이션 결제 | 키 1개 issued + 구매자/관리자 알림톡 1통씩 |
| 5  | 동시 결제 50건 | xargs -P 50 curl | 키 50개 1:1, 중복 0 |
| 6  | 재고 0 결제 | ULTRA 0 + 결제 | OUT_OF_STOCK + LOW_STOCK 알림톡 + 구매자 알림톡 미발송 |
| 7  | 수동 매칭 | match 화면 → 매칭 | 키 발급 + 구매자 알림톡 + MANUAL_ISSUE 로그 |
| 8  | 결제 실패 | pay_state=64 | 키 재고 변동 없음, 알림톡 미발송 |
| 9  | 중복 웹훅 | 같은 mul_no 2회 | 1키만 발급, idempotency 차단 |
| 10 | 키 폐기 | issued 키 revoke | status=revoked, 이후 결제 미사용 |
| 11 | 재발급 | issued 키 reissue | 기존 revoke + 신규 issue + 알림톡 재발송 |
| 12 | 플랜 불일치 | 수동 매칭에서 다른 플랜 키 선택 | 409 plan_mismatch |
| 13 | 임계치 배지 | 가용 ≤ 5 | StockCard 코랄 보더 + "재고 부족" 배지 |
| 14 | 부하 100/초 | xargs -P 100 | SKIP LOCKED 대기 없음, 중복 0 |
| 15 | 로그 JSON | 임의 액션 후 logs 페이지 | before/after diff 표시, 키 평문 마스킹 |

## 10. 자주 묻는 질문

**Q. 키 원문을 클립보드로 복사하면 감사 로그가 남나요?**
A. 네 — "원문 보기" 버튼을 누르는 순간 `KEY_REVEAL` 액션이 기록됩니다. 복사 자체는 별도 추적하지 않습니다.

**Q. 이미 발급된 키의 플랜을 바꿀 수 있나요?**
A. 안 됩니다. `status=available` 일 때만 plan_code 변경이 허용됩니다 (409 plan_change_only_when_available).

**Q. plans 테이블을 비활성으로 두면 어떻게 되나요?**
A. 그 플랜으로 새 결제·발급이 차단됩니다 (`PLAN_NOT_FOUND` 예외). 이미 issued된 키와 진행 중 주문에는 영향 없음.

**Q. `paid_pending_key` 주문이 자동 처리되나요?**
A. 자동 재시도는 없습니다. 운영자가 키를 충전한 뒤 `/vending/match` 에서 수동 매칭해야 합니다.
