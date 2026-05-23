export interface BlockResult {
  blocked: boolean;
  reason: string | null;
  refusalMessage: string | null;
}

const BLOCKED_PATTERNS = [
  // 1. Coding requests
  {
    regex: /(코드\s*(짜|작성|만들|구현|디버깅|분석|짜줘|작성해줘|구현해줘|알려줘))|(짜줘|작성해줘|디버깅해줘|코딩해줘)/i,
    reason: "코드 작성 이나 프로그래밍 디버깅 요청",
    desc: "코드 작성 및 개발 요청"
  },
  // 2. LLM comparison / other companies (anthropic/앤스로픽 제외: 자사 상품이 Anthropic Claude 키이므로 관련 질문 허용)
  // (네이버 제외: 네이버페이 결제 관련 문의 허용)
  {
    regex: /(gpt|openai|chatgpt|gemini|제미나이|llama|라마|deepmind|딥마인드|clova|클로바|ms|microsoft|마이크로소프트)/i,
    reason: "타사 모델 및 서비스 비교 평가 요청",
    desc: "타 LLM/회사와의 비교나 평가 요청"
  },
  // 3. Politics, religion, medical, legal, financial
  {
    regex: /(정치|대통령|선거|민주당|국민의힘|종교|기독교|불교|이슬람|의료|치료|진단|의학|약물|법률|변호사|기소|재판|금융|투자|주식|코인|재테크)/i,
    reason: "정치, 종교, 의료, 법률 혹은 금융 자문 요청",
    desc: "정치·종교·의료·법률·금융 관련 정보"
  },
  // 4. Injection / Jailbreak / Instruction extraction
  {
    regex: /(ignore\s+previous|system\s+prompt|instructions|시스템\s*프롬프트|지시\s*사항|역할\s*변경|모델명|api\s*key|api\s*키|비밀번호|환경변수)/i,
    reason: "시스템 내부 정보 및 프롬프트 조회 요청",
    desc: "시스템 설정이나 프롬프트 요구"
  }
];

export function checkBlocklist(input: string): BlockResult {
  const sanitized = input.trim();

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.regex.test(sanitized)) {
      const refusalMessage = `도움드리고 싶은데 죄송합니다.
저는 클코클라우드 상품·결제·사용법 안내에 특화되어 있어, ${pattern.reason}은 응대가 어려워요.

대신 클코클라우드와 관련된 질문이 있으시면 편하게 물어봐 주세요. 운영자 직접 문의는 support.clcocloud@gmail.com 입니다.`;

      return {
        blocked: true,
        reason: pattern.desc,
        refusalMessage
      };
    }
  }

  return {
    blocked: false,
    reason: null,
    refusalMessage: null
  };
}
