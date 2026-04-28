import { BrandLogo } from "@/components/ui/BrandLogo";

const groups: Array<{ title: string; links: string[] }> = [
  { title: "메뉴", links: ["요금표", "FAQ", "사용 흐름"] },
  { title: "회사", links: ["발급 안내", "환불 정책", "비공식 서비스 안내"] },
  { title: "소셜", links: ["디스코드", "문의 채널"] },
  { title: "법적", links: ["이용약관", "개인정보처리방침"] }
];

export function Sequence13Footer() {
  return (
    <footer className="dark-panel noise px-5 py-16">
      <div className="container-cinematic grid gap-12 lg:grid-cols-[.38fr_.62fr]">
        <div>
          <a href="#" className="flex items-center gap-3 text-lg font-semibold">
            <BrandLogo size={28} className="animate-slow-spin" />
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
                  <li key={link}>
                    <a href="#" className="group inline-flex items-center gap-2 border-b border-transparent pb-0.5 transition hover:border-coral hover:text-coral">
                      <span className="h-1 w-1 rounded-full bg-coral opacity-0 transition duration-200 group-hover:opacity-100" />
                      {link}
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
