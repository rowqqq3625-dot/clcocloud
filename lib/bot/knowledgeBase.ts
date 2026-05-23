/**
 * 클코클라우드 AI 상담봇 — 지식 기반 응답 엔진
 *
 * DashScope API가 미활성 상태일 때 사용되는 스마트 폴백 시스템.
 * 단순 키워드 매칭이 아닌, 점수 기반 다중 토픽 매칭으로
 * 고객의 실제 질문 의도를 파악하여 맞춤형 답변을 생성합니다.
 */

export interface KnowledgeEntry {
  id: string;
  /** 매칭 키워드 — 하나라도 포함되면 점수 가산 */
  keywords: string[];
  /** 강한 키워드 — 이것만 있어도 이 토픽이 확정되는 핵심어 */
  strongKeywords?: string[];
  /** 부정 키워드 — 이게 포함되면 이 토픽에서 제외 */
  negativeKeywords?: string[];
  /** 응답 텍스트 */
  response: string;
  /** 템플릿 응답 여부 (true면 쿼터 미차감) */
  isTemplate: boolean;
  /** 티켓 폼 포함 여부 */
  requiresTicket?: boolean;
}

const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // ────────────────────────────────────────────────
  // 1. 요금제 / 가격
  // ────────────────────────────────────────────────
  {
    id: "pricing",
    keywords: ["가격", "요금", "금액", "얼마", "플랜", "비용", "돈", "원", "달러", "할인", "절감", "싸"],
    strongKeywords: ["스탠다드", "프로플랜", "울트라", "98000", "196000", "264000"],
    response: `클코클라우드의 Anthropic Claude API 키 잔액형 상품 요금제는 다음과 같이 구성되어 있습니다. 😊

- **스탠다드 플랜**: ₩98,000 (약 $200 충전, 정가 대비 약 68% 절감)
- **프로 플랜**: ₩196,000 (약 $500 충전, 정가 대비 약 74% 절감, 가장 인기 🔥)
- **울트라 플랜**: ₩264,000 (약 $1,000 충전, 정가 대비 약 83% 절감)

모든 플랜은 잔액에 만료 기한이 없으며, 개인 전용 API 키가 발급됩니다. 원하시는 용량과 가성비에 맞춰 자유롭게 선택해보세요! 🍀`,
    isTemplate: true
  },

  // ────────────────────────────────────────────────
  // 2. 결제 방법
  // ────────────────────────────────────────────────
  {
    id: "payment",
    keywords: ["결제", "카드", "이체", "페이", "토스", "카카오", "네이버", "가상계좌", "입금", "지불", "송금", "계좌"],
    strongKeywords: ["결제방법", "결제수단"],
    negativeKeywords: ["누락", "안됨", "실패", "오류"],
    response: `클코클라우드는 고객님의 편의를 위해 다양한 결제 수단을 지원합니다. 💳

- **신용카드/체크카드** 결제 (국내 전 카드사 지원)
- **실시간 계좌이체** 및 **가상계좌** 발급
- **간편결제**: 카카오페이, 네이버페이, 토스페이

수수료 걱정 없이 간편하게 원하시는 수단으로 결제해보세요! 🍀`,
    isTemplate: true
  },

  // ────────────────────────────────────────────────
  // 3. API 키 발급 절차
  // ────────────────────────────────────────────────
  {
    id: "key-issue",
    keywords: ["발급", "키를", "키받", "키생성", "키발급", "어떻게", "방법", "절차", "순서"],
    strongKeywords: ["api키", "apikey", "키발급"],
    negativeKeywords: ["잔액", "사용량", "대시보드"],
    response: `API 키 발급은 결제 완료 후 대시보드에서 매우 간편하게 진행됩니다! (약 1분 소요) 🔑

1. 홈페이지에서 원하시는 플랜을 선택하고 결제를 진행합니다.
2. 결제 완료 후 대시보드 페이지에 진입하여 구글/네이버 등으로 로그인합니다.
3. 대시보드 내 **[API 키 발급]** 버튼을 클릭해 고유 키를 생성합니다.
4. 발급된 키를 복사하여 Cursor, VS Code, Claude Code 등 원하시는 환경에 설정하여 사용합니다.

대시보드를 통해 언제든 즉시 조회가 가능합니다! ✨`,
    isTemplate: true
  },

  // ────────────────────────────────────────────────
  // 4. 잔액 / 사용량 확인
  // ────────────────────────────────────────────────
  {
    id: "balance",
    keywords: ["잔액", "사용량", "확인", "조회", "대시보드", "남은", "얼마나", "남았", "충전량"],
    strongKeywords: ["잔액확인", "사용량확인", "대시보드"],
    response: `실시간 잔액 및 사용량 조회가 가능합니다! 📊

- 클코클라우드 대시보드에 로그인하시면 현재 남은 API 잔액($)과 실시간 사용 현황을 확인하실 수 있습니다.
- 대시보드는 **30초마다 자동으로 최신화**되며, 최근 요청 기록 30건(10건씩 3페이지)과 상세 CSV 데이터 내보내기 기능을 완벽 지원합니다.
- 발급받으신 키의 잔액에는 **만료 기한이 없으므로** 기간에 쫓기지 않고 안심하고 쓰실 수 있습니다!

대시보드 접속은 clcocloud.kr 상단 메뉴에서 바로 하실 수 있어요. 😊`,
    isTemplate: true
  },

  // ────────────────────────────────────────────────
  // 5. 환불 정책
  // ────────────────────────────────────────────────
  {
    id: "refund-info",
    keywords: ["환불", "취소", "반품", "반환", "환불정책"],
    negativeKeywords: ["요청", "신청", "해줘", "바랍니다", "해주세요"],
    response: `클코클라우드의 환불 규정 안내입니다. 📋

- API 키 정보를 전달받으신 이후 잔액을 실제로 사용하신 경우에는 디지털 상품 특성상 환불이 어렵습니다.
- 단, 발급받으신 API 키 자체에 시스템상 심각한 결함이 발생하거나 사용 불가 상태가 검증된 경우에는 **즉시 키 교체 또는 전액 환불**을 보장해 드립니다!
- 환불에 대한 상세한 신청은 support.clcocloud@gmail.com 메일로 문의 부탁드립니다.

걱정 마세요, 문제가 있으면 언제든 도와드리겠습니다! 🍀`,
    isTemplate: true
  },

  // ────────────────────────────────────────────────
  // 6. 연동 방법 (Cursor / VS Code / Claude Code)
  // ────────────────────────────────────────────────
  {
    id: "integration",
    keywords: ["연동", "설정", "커서", "cursor", "vscode", "클로드코드", "claudecode", "세팅", "baseurl", "base_url", "endpoint", "엔드포인트", "opencode", "오픈코드"],
    strongKeywords: ["연동방법", "연동법", "설정방법", "api-anthropic"],
    response: `클코클라우드 키 연동 방법을 안내해 드릴게요! 🔧

**Cursor 연동법**:
- Cursor 설정(Settings) → Models → Anthropic API Key 칸에 발급받은 키를 등록합니다.
- Base URL을 \`https://api-anthropic.com/v1\` 로 지정하면 완벽 호환됩니다.

**VS Code 연동법**:
- VS Code 확장의 Anthropic provider 설정 내 API URL(Base URL)을 \`https://api-anthropic.com/v1\` 로 입력합니다.
- 키 값을 클코클라우드에서 발급받은 값으로 등록합니다.

**Claude Code 연동법**:
- 시스템 환경 변수에 아래 두 줄을 추가합니다:
  \`export ANTHROPIC_BASE_URL="https://api-anthropic.com/v1"\`
  \`export ANTHROPIC_AUTH_TOKEN="발급된_키"\`

상세 문서는 상단 메뉴의 **[개발자 문서]**를 참조해 주세요! 💡`,
    isTemplate: true
  },

  // ────────────────────────────────────────────────
  // 7. 에이전트 자동 연동 프롬프트
  // ────────────────────────────────────────────────
  {
    id: "agent-prompt",
    keywords: ["프롬프트", "자동연동", "자동설정", "github", "clcocloud.md", "instructions", "install"],
    strongKeywords: ["github.com/clcocloud", "clcocloud.md", "installandconfigure"],
    response: `질문하신 연동 프롬프트는 에이전트에 클코클라우드 설정을 완벽하게 주입하기 위한 공통 자동화 프롬프트입니다! 💡

- **공식 프롬프트**: \`Install and configure anthropic model by following the instructions here: https://github.com/clcocloud/clcocloud.md\`
- **작동 원리**: 코딩 에이전트에 이 텍스트를 그대로 붙여넣으면, 에이전트가 지정된 깃허브 마크다운의 환경 변수 스펙을 자동 추적하여 클코클라우드 API 키와 엔드포인트(api-anthropic.com/v1) 세팅을 사람의 개입 없이 자동으로 마칩니다.
- **사용 방법**: Cursor, VS Code, Hermes, n8n 등 외부 에이전트가 켜진 상태에서 첫 대화창에 해당 프롬프트 한 문장을 그대로 입력하시면 됩니다.

상세 연동 가이드는 상단 메뉴의 **[개발자 문서] → [외부 에이전트 연동]** 탭에 자세하게 실려 있으니 참고해 보세요! 🍀`,
    isTemplate: true
  },

  // ────────────────────────────────────────────────
  // 8. 오류/에러 트러블슈팅
  // ────────────────────────────────────────────────
  {
    id: "error-troubleshoot",
    keywords: ["오류", "에러", "error", "안됨", "안돼", "작동안", "실패", "문제", "401", "403", "404", "500", "timeout", "invalid", "denied", "unauthorized", "connection", "refused"],
    strongKeywords: ["에러메시지", "오류코드", "에러코드"],
    response: `오류가 발생하셨군요, 걱정 마세요! 빠르게 해결을 도와드릴게요. 🔍

가장 흔한 오류 원인과 해결법을 안내해 드립니다:

- **401 Unauthorized / Invalid API Key**: API 키가 올바르게 입력되었는지, 앞뒤 공백 없이 정확히 복사-붙여넣기 하셨는지 확인해 주세요.
- **403 Forbidden**: Base URL이 \`https://api-anthropic.com/v1\` 로 정확히 설정되었는지 확인해 주세요. 공식 Anthropic URL(api.anthropic.com)이 아닌 클코클라우드 전용 URL을 사용하셔야 합니다.
- **Connection Refused / Timeout**: 네트워크 연결 상태를 확인하시고, 방화벽이나 VPN이 요청을 차단하고 있지 않은지 점검해 주세요.
- **잔액 부족**: 대시보드에서 잔액이 남아있는지 확인해 주세요. 잔액이 $0이면 API 요청이 거부됩니다.

위 방법으로 해결이 되지 않으시면 오류 화면을 캡처하여 보내주시면 더 자세히 분석해 드릴게요! 😊`,
    isTemplate: false
  },

  // ────────────────────────────────────────────────
  // 9. 잔액 추가 충전
  // ────────────────────────────────────────────────
  {
    id: "topup",
    keywords: ["충전", "추가", "더", "잔액충전", "추가결제", "추가충전", "리필"],
    strongKeywords: ["잔액충전", "추가충전"],
    response: `잔액 추가 충전 안내입니다! 💰

- 추가 잔액 충전은 **$1,000 ~ $5,000** 범위에서 **$100 단위**로 가능합니다.
- 특별 우대 환율 **$100당 ₩40,000**이 적용됩니다.
- 기존 키의 잔액에 합산되어 누적 사용이 가능합니다.

추가 충전을 원하시면 홈페이지 하단의 **잔액충전 문의** 섹션을 이용하시거나, 가격표에서 원하시는 금액을 설정하여 바로 결제하실 수 있습니다! 🍀`,
    isTemplate: true
  },

  // ────────────────────────────────────────────────
  // 10. 호환 모델 / 지원 모델
  // ────────────────────────────────────────────────
  {
    id: "models",
    keywords: ["모델", "sonnet", "opus", "haiku", "claude", "지원", "호환", "사용가능", "어떤모델"],
    negativeKeywords: ["상담모델", "ai모델"],
    response: `클코클라우드에서 지원하는 모델 안내입니다! 🤖

- 현재 페이지의 기본 지원 모델은 **Claude Sonnet, Opus, Haiku** 계열입니다.
- 공식 Claude Code, VS Code, Cursor, Open Code에서 모두 호환됩니다.
- 실제 지원 모델 범위는 발급 시점의 정책에 따라 안내해 드리며, 모델 업데이트 시 추가 비용 없이 최신 모델을 이용하실 수 있습니다.

특정 모델 호환 여부가 궁금하시면 편하게 문의해 주세요! 😊`,
    isTemplate: true
  },

  // ────────────────────────────────────────────────
  // 11. 로그인 / 계정
  // ────────────────────────────────────────────────
  {
    id: "login-account",
    keywords: ["로그인", "계정", "비밀번호", "가입", "회원", "아이디", "소셜", "구글", "네이버로그인"],
    response: `로그인 및 계정 관련 안내입니다! 🔐

- 클코클라우드는 **구글, 네이버 등 소셜 로그인**을 지원합니다. 별도의 회원가입 절차 없이 간편하게 로그인하실 수 있습니다.
- 로그인 후 대시보드에서 API 키 발급, 잔액 확인, 사용 내역 조회 등 모든 기능을 이용하실 수 있습니다.
- 로그인에 문제가 있으시면 브라우저 캐시를 삭제하시거나, 다른 브라우저에서 시도해 보시길 권장합니다.

추가 도움이 필요하시면 말씀해 주세요! 💡`,
    isTemplate: true
  },

  // ────────────────────────────────────────────────
  // 12. 구독 vs 잔액형 차이
  // ────────────────────────────────────────────────
  {
    id: "subscription-vs-balance",
    keywords: ["구독", "월정액", "정기", "자동결제", "반복", "차이", "다른점", "비교"],
    negativeKeywords: ["gpt", "gemini"],
    response: `클코클라우드는 **구독형이 아닌 1회성 잔액 충전 방식**입니다! 💡

- **월 구독 없음**: 원하는 잔액 플랜을 1회 결제하고, 잔액이 남아있는 동안 계속 사용합니다.
- **일일 제한 없음**: 구독형 서비스의 일일 메시지 제한이나 채팅 대기 큐가 없습니다.
- **잔액 만료 없음**: 충전된 잔액은 기간 만료 없이 유지됩니다.
- **개인 전용 키**: 공유 계정이 아닌 나만의 독립적인 API 키를 사용합니다.

필요한 만큼만 충전하고, 쓴 만큼만 차감되는 합리적인 구조입니다! 🍀`,
    isTemplate: true
  },

  // ────────────────────────────────────────────────
  // 13. 관리자 연결 / 상담원 요청 → 티켓
  // ────────────────────────────────────────────────
  {
    id: "admin-request",
    keywords: ["상담원", "관리자", "운영자", "사람", "직원"],
    strongKeywords: ["상담원연결", "상담원바꿔", "관리자연결", "운영자연결"],
    response: `요청하신 사항은 운영진의 직접적인 수동 확인 및 조치가 필요한 사안입니다. 😊

아래 문의 티켓 양식에 성함, 연락 가능한 이메일 주소, 요청 내용을 작성해 남겨주시면 확인하는 즉시 기입하신 이메일로 1시간 내 복구 및 안내를 신속히 도와드리겠습니다! 📬

[TICKET_FORM]`,
    isTemplate: false,
    requiresTicket: true
  },

  // ────────────────────────────────────────────────
  // 14. 결제 누락 / 입금 확인 → 티켓
  // ────────────────────────────────────────────────
  {
    id: "payment-issue",
    keywords: ["입금누락", "송금누락", "결제누락", "입금확인", "결제실패", "결제오류"],
    strongKeywords: ["입금누락", "송금누락", "입금확인안됨", "결제누락"],
    response: `입금 관련 문제가 발생하셨군요, 정말 불편하셨겠습니다. 빠르게 확인해 드리겠습니다! 😊

이 사안은 운영진이 결제 내역을 직접 대조하고 확인해야 하는 수동 관여 사항입니다. 아래 문의 양식에 결제 일시, 결제 수단, 금액, 그리고 연락 가능한 이메일을 남겨주시면 **1시간 이내에** 확인 후 안내 메일을 보내드리겠습니다! 📬

[TICKET_FORM]`,
    isTemplate: false,
    requiresTicket: true
  },

  // ────────────────────────────────────────────────
  // 15. 환불 신청 → 티켓
  // ────────────────────────────────────────────────
  {
    id: "refund-request",
    keywords: ["환불"],
    strongKeywords: ["환불요청", "환불신청", "환불해줘", "환불바랍니다", "환불해주세요"],
    response: `환불 요청을 접수해 드리겠습니다. 😊

이 사안은 운영진이 결제 및 사용 내역을 직접 확인하고 처리해야 하는 사항입니다. 아래 문의 양식에 결제 일시, 환불 사유, 연락 가능한 이메일을 남겨주시면 **신속하게 검토 후 안내**해 드리겠습니다! 📬

[TICKET_FORM]`,
    isTemplate: false,
    requiresTicket: true
  },

  // ────────────────────────────────────────────────
  // 16. 이미지 첨부 대응
  // ────────────────────────────────────────────────
  {
    id: "image-analysis",
    keywords: ["__HAS_IMAGE__"],
    response: `보내주신 이미지를 확인했습니다! 🔍

현재 AI 상담 시스템이 이미지를 직접 분석하는 기능을 준비 중에 있어, 이미지 내용에 대한 정밀 분석은 잠시 후 업데이트될 예정입니다.

그동안 이미지에서 보이는 **오류 메시지나 설정 화면에 대해 텍스트로 설명**해 주시면 바로 도움을 드릴 수 있습니다! 예를 들어:
- 어떤 프로그램(Cursor, VS Code 등)에서 발생한 문제인지
- 오류 메시지의 내용이 무엇인지
- 어떤 작업을 하다가 발생했는지

알려주시면 최선을 다해 해결해 드리겠습니다! 😊`,
    isTemplate: false
  },

  // ────────────────────────────────────────────────
  // 17. 안전성 / 보안
  // ────────────────────────────────────────────────
  {
    id: "security",
    keywords: ["안전", "보안", "해킹", "유출", "안전한가", "믿을수", "신뢰", "안정성"],
    response: `클코클라우드의 안전성에 대해 안내해 드립니다! 🛡️

- 모든 API 키는 **개인 전용**으로 발급되며, 다른 사용자와 공유되지 않습니다.
- 키 정보는 **암호화되어 안전하게 관리**됩니다.
- 대시보드에서 실시간으로 사용 내역을 모니터링하여 비정상적인 사용을 즉시 감지할 수 있습니다.
- API 키가 노출된 것으로 의심되시면 즉시 support.clcocloud@gmail.com 으로 연락해 주시면 키를 교체해 드립니다.

고객님의 키와 잔액은 안전하게 보호됩니다! 😊`,
    isTemplate: true
  },

  // ────────────────────────────────────────────────
  // 18. 번들 패키지
  // ────────────────────────────────────────────────
  {
    id: "bundle",
    keywords: ["번들", "패키지", "조합", "gemini", "perplexity", "결합"],
    response: `클코클라우드 번들 패키지에 대한 안내입니다! 📦

현재 다음 번들 상품을 준비 중입니다:
- **클코클라우드 × Gemini**: Google Gemini Advanced 구독 + 클로드코드 API 키 결합
- **클코클라우드 × GPT**: ChatGPT Plus 구독 + 클로드코드 API 키 결합
- **클코클라우드 × Perplexity**: Perplexity Pro 구독 + 클로드코드 API 키 결합

번들 상품은 현재 준비 중이며, 출시 시 홈페이지에서 바로 확인하실 수 있습니다. 관심을 가져주셔서 감사합니다! 🍀`,
    isTemplate: true
  },
];

/** 점수 기반 토픽 매칭 */
function scoreEntry(entry: KnowledgeEntry, normalizedInput: string, hasImage: boolean): number {
  let score = 0;

  // 이미지 특수 처리
  if (entry.id === "image-analysis" && hasImage) {
    score += 50;
  }

  // 부정 키워드 체크 (하나라도 포함되면 이 토픽 제외)
  if (entry.negativeKeywords) {
    for (const neg of entry.negativeKeywords) {
      if (normalizedInput.includes(neg.toLowerCase().replace(/\s+/g, ""))) {
        return -100;
      }
    }
  }

  // 강한 키워드 체크 (높은 점수)
  if (entry.strongKeywords) {
    for (const strong of entry.strongKeywords) {
      if (normalizedInput.includes(strong.toLowerCase().replace(/\s+/g, ""))) {
        score += 30;
      }
    }
  }

  // 일반 키워드 체크
  for (const keyword of entry.keywords) {
    if (keyword === "__HAS_IMAGE__") continue;
    if (normalizedInput.includes(keyword.toLowerCase().replace(/\s+/g, ""))) {
      score += 5;
    }
  }

  return score;
}

/**
 * 지식 기반에서 최적의 응답을 찾아 반환합니다.
 * 여러 토픽이 매칭될 경우 가장 높은 점수의 토픽을 선택합니다.
 */
export function findBestResponse(
  userMessage: string,
  hasImage: boolean = false
): { content: string; isTemplate: boolean } {
  const normalized = userMessage.toLowerCase().replace(/\s+/g, "");

  let bestEntry: KnowledgeEntry | null = null;
  let bestScore = 0;

  for (const entry of KNOWLEDGE_BASE) {
    const score = scoreEntry(entry, normalized, hasImage);
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  // 이미지가 있고 다른 토픽도 매칭된 경우, 이미지 분석 + 해당 토픽 답변을 결합
  if (hasImage && bestEntry && bestEntry.id !== "image-analysis") {
    const imageNote = `보내주신 이미지를 확인했습니다! 현재 이미지 정밀 분석 기능을 준비 중이지만, 텍스트로 질문해 주신 내용에 대해 바로 답변해 드릴게요. 🔍\n\n`;
    return {
      content: imageNote + bestEntry.response,
      isTemplate: bestEntry.isTemplate
    };
  }

  if (bestEntry && bestScore > 0) {
    return {
      content: bestEntry.response,
      isTemplate: bestEntry.isTemplate
    };
  }

  // 매칭되는 토픽이 없는 경우 — 범용 안내
  return {
    content: `안녕하세요! 클코클라우드 AI 상담봇입니다. 😊

질문해 주신 내용을 확인했습니다! 아래와 같은 주제에 대해 상세하게 안내해 드릴 수 있어요:

- **요금제 안내** — 스탠다드/프로/울트라 플랜 가격 및 혜택
- **결제 방법** — 카드, 계좌이체, 간편결제 등
- **API 키 발급** — 결제부터 키 발급까지 4단계 절차
- **연동 방법** — Cursor, VS Code, Claude Code 설정법
- **잔액/사용량** — 대시보드 실시간 조회
- **오류 해결** — 인증 오류, 연결 문제 등 트러블슈팅
- **환불 정책** — 환불 조건 및 절차

궁금하신 내용을 편하게 말씀해 주시면 최선을 다해 도와드리겠습니다! 🍀`,
    isTemplate: true
  };
}
