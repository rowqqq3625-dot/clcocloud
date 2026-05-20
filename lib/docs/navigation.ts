export type NavItem = {
  title: string;
  href: string;
};

export type NavGroup = {
  group: string;
  items: NavItem[];
};

export const NAV: NavGroup[] = [
  {
    group: "시작하기",
    items: [
      { title: "개요", href: "/docs" },
      { title: "빠른시작", href: "/docs/quickstart" },
      { title: "API 키 발급", href: "/docs/api-key" },
      { title: "사용법", href: "/docs/usage" }
    ]
  },
  {
    group: "설치 & 설정",
    items: [
      { title: "클로드코드CLI", href: "/docs/installation" },
      { title: "환경 변수 레퍼런스", href: "/docs/environment-variables" }
    ]
  },
  {
    group: "클라이언트 연동",
    items: [
      { title: "외부 에이전트 연동", href: "/docs/agent-integration" },
      { title: "커서", href: "/docs/clients/cursor" },
      { title: "오픈클로", href: "/docs/clients/openclaw" },
      { title: "VS코드", href: "/docs/clients/vscode" },
      { title: "오픈코드", href: "/docs/clients/opencode" },
      { title: "n8n", href: "/docs/clients/n8n" },
      { title: "헤르메스 에이전트", href: "/docs/clients/hermes" }
    ]
  },
  {
    group: "운영",
    items: [
      { title: "사용량 모니터링", href: "/docs/usage-monitoring" },
      { title: "요금제", href: "/docs/pricing-plans" },
      { title: "모델가격", href: "/docs/model-pricing" },
      { title: "오류코드", href: "/docs/error-codes" },
      { title: "문제 해결", href: "/docs/troubleshooting" },
      { title: "FAQ", href: "/docs/faq" }
    ]
  },
  {
    group: "정책 & 지원",
    items: [
      { title: "이용약관 및 정책", href: "/docs/terms" },
      { title: "문의하기", href: "/docs/support" }
    ]
  }
];

export const FLAT_NAV = NAV.flatMap((group) => group.items).filter((item) => !item.href.includes("#"));

export function getNavIndex(pathname: string) {
  return FLAT_NAV.findIndex((item) => item.href.split("#")[0] === pathname);
}

export function getPrevNext(pathname: string) {
  const index = getNavIndex(pathname);
  return {
    prev: index > 0 ? FLAT_NAV[index - 1] : undefined,
    next: index >= 0 && index < FLAT_NAV.length - 1 ? FLAT_NAV[index + 1] : undefined
  };
}

export function getTitleByPath(pathname: string) {
  return FLAT_NAV.find((item) => item.href.split("#")[0] === pathname)?.title ?? "문서";
}
