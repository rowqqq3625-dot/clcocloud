import { NAV } from "./navigation";

export type SearchEntry = {
  title: string;
  href: string;
  section: string;
  snippet: string;
};

export const SEARCH_INDEX: SearchEntry[] = [
  {
    title: "클코클라우드 문서",
    href: "/docs",
    section: "개요",
    snippet: "클로드 코드를 공식보다 합리적으로, 안정적으로 쓰기 위한 모든 가이드"
  },
  {
    title: "빠른시작",
    href: "/docs/quickstart",
    section: "Quick Start",
    snippet: "결제, API 키 발급, 환경변수 설정, 클로드 코드 실행"
  },
  {
    title: "API 키 발급",
    href: "/docs/api-key",
    section: "키 형식",
    snippet: "sk-ant-api03-xxxxxxxxx, 발급, 구매내역, 키 관리"
  },
  {
    title: "OS별 설치 & 환경 변수 설정",
    href: "/docs/installation",
    section: "설치",
    snippet: "클로드코드CLI 설치와 OS별 환경 변수 설정"
  },
  {
    title: "외부 에이전트 연동",
    href: "/docs/agent-integration",
    section: "Agent",
    snippet: "클로드코드 CLI, 커서, VS코드, 오픈코드, n8n 연동"
  },
  {
    title: "환경 변수 레퍼런스",
    href: "/docs/environment-variables",
    section: "Variables",
    snippet: "ANTHROPIC_BASE_URL, ANTHROPIC_AUTH_TOKEN, ANTHROPIC_API_KEY"
  },
  {
    title: "문제 해결",
    href: "/docs/troubleshooting",
    section: "Troubleshooting",
    snippet: "Invalid API key, BASE_URL 미반영, Windows setx"
  },
  {
    title: "FAQ",
    href: "/docs/faq",
    section: "FAQ",
    snippet: "개발자용 자주 묻는 질문"
  },
  {
    title: "요금제",
    href: "/docs/pricing-plans",
    section: "Pricing",
    snippet: "클코클라우드 플랜과 모델가격 문서 연결"
  },
  {
    title: "모델가격",
    href: "/docs/model-pricing",
    section: "Pricing",
    snippet: "오푸스 4.7, 소넷 4.6, 하이쿠 4.5 입력 출력 가격"
  },
  {
    title: "오류코드",
    href: "/docs/error-codes",
    section: "Errors",
    snippet: "400, 401, 403, 429, 502 오류 의미와 확인 기준"
  },
  {
    title: "사용량 모니터링",
    href: "/docs/usage-monitoring",
    section: "Usage",
    snippet: "잔액 조회 API, 요청 로그, 사용량 확인"
  },
  { title: "사용법", href: "/docs/usage", section: "CLI", snippet: "클로드코드 CLI 기본 명령어와 초보자 사용 흐름" },
  { title: "커서", href: "/docs/clients/cursor", section: "Clients", snippet: "커서 Anthropic 호환 설정" },
  { title: "오픈클로", href: "/docs/clients/openclaw", section: "Clients", snippet: "오픈클로 endpoint와 token 설정" },
  { title: "VS코드", href: "/docs/clients/vscode", section: "Clients", snippet: "VS코드 Anthropic provider 설정" },
  { title: "오픈코드", href: "/docs/clients/opencode", section: "Clients", snippet: "오픈코드 provider 설정" },
  { title: "n8n", href: "/docs/clients/n8n", section: "Clients", snippet: "n8n 환경 변수 설정" },
  { title: "헤르메스 에이전트", href: "/docs/clients/hermes", section: "Clients", snippet: "헤르메스 에이전트 YAML 설정" },
  { title: "이용약관 및 정책", href: "/docs/terms", section: "Terms", snippet: "약관, 정책, 구매자 책임, 환불 기준" },
  { title: "문의하기", href: "/docs/support", section: "Support", snippet: "support.clcocloud@gmail.com" },
  ...NAV.flatMap((group) =>
    group.items.map((item) => ({
      title: item.title,
      href: item.href,
      section: group.group,
      snippet: `${group.group} 문서 항목`
    }))
  )
];
