import { BrandLogo } from "@/components/ui/BrandLogo";

const groups: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  {
    title: "메뉴",
    links: [
      { label: "가격", href: "#pricing" },
      { label: "사용법", href: "#flow" },
      { label: "대시보드", href: "/dashboard" },
      { label: "FAQ", href: "#faq" }
    ]
  },
  {
    title: "구매",
    links: [
      { label: "플랜 계산", href: "#calculator" },
      { label: "구매 옵션", href: "#pricing" },
      { label: "발급 안내", href: "#flow" },
      { label: "문의하기", href: "#final" }
    ]
  },
  {
    title: "안내",
    links: [
      { label: "환불 정책", href: "#faq" },
      { label: "비공식 서비스 안내", href: "#faq" },
      { label: "잔액 대시보드", href: "/dashboard" }
    ]
  },
  {
    title: "법적",
    links: [
      { label: "이용약관", href: "#faq" },
      { label: "개인정보처리방침", href: "#faq" }
    ]
  }
];

export function Sequence13Footer() {
  return (
    <footer className="dark-panel noise px-5 py-16">
      <div className="container-cinematic grid gap-12 lg:grid-cols-[.38fr_.62fr]">
        <div>
          <a href="/" className="flex items-center gap-3 text-lg font-semibold">
            <BrandLogo size={32} className="drop-shadow-[0_10px_24px_rgba(217,119,87,.18)]" />
            클코클라우드
          </a>
          <p className="mt-5 max-w-sm leading-7 text-cream/54">
            클코클라우드는 Anthropic 공식 서비스가 아닌 별도 API 키 발급/잔액 관리 서비스입니다.
          </p>
        </div>
        <nav className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4" aria-label="푸터 탐색">
          {groups.map(({ title, links }) => (
            <div key={title}>
              <h3 className="font-semibold text-cream">{title}</h3>
              <ul className="mt-4 grid gap-3 text-sm text-cream/54">
                {links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="group inline-flex items-center gap-2 border-b border-transparent pb-0.5 transition hover:border-coral hover:text-coral">
                      <span className="h-1 w-1 rounded-full bg-coral opacity-0 transition duration-200 group-hover:opacity-100" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="container-cinematic mt-14 border-t border-white/10 pt-6 text-sm text-cream/42">
        ⓒ 2026 클코클라우드. 모든 권리 보유.
      </div>
    </footer>
  );
}
