/**
 * ---------------------------------------------------------------------------
 * Comparison Section — 클코클라우드 vs 타사 공유 구독 vs 클로드 정식 API
 * ---------------------------------------------------------------------------
 *
 * 이 파일은 랜딩페이지 비교표 섹션의 정적 데이터를 정의합니다.
 *
 * 운영자 매뉴얼:
 *   • 비교표 값을 수정하려면 아래 COMPARISON_ROWS 배열에서 해당 행의
 *     text / tier 값을 변경하세요.
 *   • 컬럼 순서는 ComparisonRow 인터페이스 필드 순서를 그대로 유지합니다
 *     (clco → thirdParty → officialApi). 화면 좌→우 / 위→아래 모두 동일.
 *   • tier 값은 다음 의미로 사용됩니다:
 *       'good' — 해당 행에서 가장 유리 (✅, coral 강조)
 *       'fair' — 사용 가능하지만 제약 있음 (⭕, cream)
 *       'poor' — 제약이 크거나 미지원 (❌, cream 40% opacity)
 *   • 비방·허위광고 리스크 차단을 위해 타사는 "타사 공유 구독"으로 익명 표기,
 *     클로드 정식 API는 Anthropic 공식 명칭을 그대로 사용합니다.
 *   • 정보 변경 시 하단 COMPARISON_DISCLAIMER 의 기준 일자도 함께 갱신하세요.
 */

export type ComparisonTier = "good" | "fair" | "poor";

export interface ComparisonCellData {
  /** 셀에 표시될 본문 텍스트 */
  text: string;
  /** 해당 항목에서 우위/제약 정도 — 아이콘/색상 분기에 사용 */
  tier: ComparisonTier;
}

export interface ComparisonRow {
  id: number;
  /** 비교 항목 라벨 (좌측 첫 셀) */
  label: string;
  /** 클코클라우드 컬럼 — 항상 최우선 노출 */
  clco: ComparisonCellData;
  /** 타사 공유 구독 컬럼 (익명 처리) */
  thirdParty: ComparisonCellData;
  /** 클로드 정식 API 컬럼 (Anthropic 공식) */
  officialApi: ComparisonCellData;
}

export type ComparisonColumnKey = "clco" | "thirdParty" | "officialApi";

export interface ComparisonColumnMeta {
  /** 컬럼 메인 명칭 */
  name: string;
  /** 컬럼 서브 설명 */
  sub: string;
  /** 대표 가격 표기 */
  price: string;
  /** 가격 옆 보조 라벨 (선택) */
  priceSuffix?: string;
  /** true일 때 coral 보더 + BEST CHOICE 배지 + 미세 글로우 적용 */
  highlight: boolean;
}

/**
 * 컬럼 메타데이터.
 * 객체 키 순서가 곧 화면 노출 순서이며, 클코 → 타사 → 정식 API 로 고정합니다.
 */
export const COMPARISON_COLUMNS: Record<ComparisonColumnKey, ComparisonColumnMeta> = {
  clco: {
    name: "클코클라우드",
    sub: "잔액형 API 키",
    price: "₩98,000부터",
    priceSuffix: "$200 분량",
    highlight: true,
  },
  thirdParty: {
    name: "타사 공유 구독",
    sub: "공유 계정 / 프록시 형태",
    price: "월 $30~50",
    highlight: false,
  },
  officialApi: {
    name: "클로드 정식 API",
    sub: "Anthropic 직접 결제",
    price: "종량제 후불",
    priceSuffix: "사용량 × 단가",
    highlight: false,
  },
};

/**
 * 화면 노출 순서 보장을 위한 헬퍼.
 * 컴포넌트에서 Object.keys 가 아닌 이 배열을 사용해 순회합니다.
 */
export const COMPARISON_COLUMN_ORDER: ComparisonColumnKey[] = [
  "clco",
  "thirdParty",
  "officialApi",
];

/**
 * 비교 행 데이터 — 12개.
 * 운영자는 각 행의 text / tier 값을 변경해 즉시 화면에 반영할 수 있습니다.
 */
export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    id: 1,
    label: "결제 방식",
    clco:        { text: "잔액 충전형 (선결제)",         tier: "good" },
    thirdParty:  { text: "월 정기 / 단기권",              tier: "fair" },
    officialApi: { text: "종량제 후불 결제",              tier: "fair" },
  },
  {
    id: 2,
    label: "시작 비용",
    clco:        { text: "₩98,000부터 (필요 시점)",       tier: "good" },
    thirdParty:  { text: "월 $30~50",                      tier: "fair" },
    officialApi: { text: "카드 등록 후 사용량만큼 청구",  tier: "fair" },
  },
  {
    id: 3,
    label: "단가",
    clco:        { text: "공식 API 대비 약 50% 수준",     tier: "good" },
    thirdParty:  { text: "저렴 (공유 분담)",              tier: "fair" },
    officialApi: { text: "100% (정가)",                   tier: "fair" },
  },
  {
    id: 4,
    label: "계정 형태",
    clco:        { text: "본인 전용 독립 API 키",         tier: "good" },
    thirdParty:  { text: "공유 계정 (다인 접속)",         tier: "poor" },
    officialApi: { text: "본인 계정 (1인 전용)",          tier: "good" },
  },
  {
    id: 5,
    label: "사용량 제한",
    clco:        { text: "잔액 한도 내 무제한",           tier: "good" },
    thirdParty:  { text: "일일/시간 사용 제한 + 점유 경쟁", tier: "poor" },
    officialApi: { text: "한도 설정 가능, 사용량만큼 과금", tier: "fair" },
  },
  {
    id: 6,
    label: "밴 / 정지 리스크",
    clco:        { text: "낮음 (정상 API 채널)",          tier: "good" },
    thirdParty:  { text: "높음 (TOS 위반 가능성)",        tier: "poor" },
    officialApi: { text: "매우 낮음 (공식)",              tier: "good" },
  },
  {
    id: 7,
    label: "클로드코드 호환",
    clco:        { text: "100% 호환",                     tier: "good" },
    thirdParty:  { text: "호환 (불안정)",                 tier: "fair" },
    officialApi: { text: "공식 지원",                     tier: "good" },
  },
  {
    id: 8,
    label: "사용량 추적",
    clco:        { text: "실시간 대시보드 + 토큰/비용 상세", tier: "good" },
    thirdParty:  { text: "제한적 / 미제공",               tier: "poor" },
    officialApi: { text: "Anthropic Console (영문)",      tier: "fair" },
  },
  {
    id: 9,
    label: "결제 단위 유연성",
    clco:        { text: "$200 / $400 / $600 + 커스텀 충전", tier: "good" },
    thirdParty:  { text: "고정 플랜",                     tier: "fair" },
    officialApi: { text: "사용량 기반 무단위",            tier: "fair" },
  },
  {
    id: 10,
    label: "잔액 만료 / 이월",
    clco:        { text: "잔액 이월 가능, 정책 안내",     tier: "good" },
    thirdParty:  { text: "미사용분 소멸",                 tier: "poor" },
    officialApi: { text: "충전 개념 없음 (후불)",         tier: "fair" },
  },
  {
    id: 11,
    label: "고객 지원",
    clco:        { text: "한국어 카카오톡 채널 + 어시스턴트", tier: "good" },
    thirdParty:  { text: "제한적",                        tier: "poor" },
    officialApi: { text: "공식 영문 지원",                tier: "fair" },
  },
  {
    id: 12,
    label: "사업자 거래 / 세금계산서",
    clco:        { text: "국내 사업자 (원화·세금계산서 발행)", tier: "good" },
    thirdParty:  { text: "대부분 미발행",                 tier: "poor" },
    officialApi: { text: "해외 결제 (외화·세금계산서 별도 절차)", tier: "fair" },
  },
];

/**
 * 비교표 하단 고지문.
 * 기준 일자와 출처를 명시해 객관성을 담보합니다.
 */
export const COMPARISON_DISCLAIMER =
  "※ 비교 정보는 2026년 5월 기준이며, 각 서비스의 공식 정책 변경에 따라 달라질 수 있습니다. " +
  "타사 공유 구독 관련 정보는 공개된 자료를 기반으로 작성되었으며, 클로드 정식 API 정보는 " +
  "Anthropic 공식 가격 정책을 기준으로 합니다.";
