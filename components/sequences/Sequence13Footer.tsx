import { BrandLogo } from "@/components/ui/BrandLogo";
import { DashboardGateLink } from "@/components/navigation/DashboardGateLink";
import Image from "next/image";

export function Sequence13Footer() {
  return (
    <footer className="dark-panel noise px-5 py-16">
      {/* 1px line separator */}
      <div className="container-cinematic mb-12">
        <div className="border-b border-white/10 pb-4" />
      </div>

      <div className="container-cinematic grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. 브랜드 */}
        <div className="flex flex-col gap-4">
          <a href="/" className="flex items-center hover:opacity-90 transition-opacity text-cream">
            <Image
              src="/footer-logo.png"
              alt="CLCOCLOUD Logo"
              width={160}
              height={36}
              className="object-contain"
            />
          </a>
          <div className="text-xs leading-relaxed text-cream/60 font-normal">
            상호: 클코클라우드 <br />
            대표자: 김정후 <br />
            사업자등록번호: 656-01-03812 <br />
            문의: support.clcocloud@gmail.com
          </div>
        </div>

        {/* 2. 제품 */}
        <div>
          <h3 className="font-semibold text-cream text-[15px]">제품</h3>
          <ul className="mt-4 grid gap-3 text-sm text-cream/54">
            <li>
              <a href="#pricing" className="hover:text-coral transition-colors duration-200">
                가격
              </a>
            </li>
            <li>
              <a href="#flow" className="hover:text-coral transition-colors duration-200">
                사용법
              </a>
            </li>
            <li>
              <DashboardGateLink className="hover:text-coral transition-colors duration-200">
                대시보드
              </DashboardGateLink>
            </li>
            <li>
              <a href="/docs" className="hover:text-coral transition-colors duration-200">
                문서
              </a>
            </li>
            <li>
              <DashboardGateLink href="/assistant" className="hover:text-coral transition-colors duration-200">
                어시스턴트
              </DashboardGateLink>
            </li>
          </ul>
        </div>

        {/* 3. 고객지원 */}
        <div>
          <h3 className="font-semibold text-cream text-[15px]">고객지원</h3>
          <ul className="mt-4 grid gap-3 text-sm text-cream/54">
            <li>
              <a href="#faq" className="hover:text-coral transition-colors duration-200">
                FAQ
              </a>
            </li>
            <li>
              <a href="#pricing" className="hover:text-coral transition-colors duration-200">
                잔액충전 문의
              </a>
            </li>
          </ul>
        </div>

        {/* 4. 법적 */}
        <div className="lg:text-right lg:items-end flex flex-col">
          <h3 className="font-semibold text-cream text-[15px]">법적</h3>
          <ul className="mt-4 grid gap-3 text-sm text-cream/54 lg:text-right">
            <li>
              <a 
                href="/docs/terms" 
                className="hover:text-coral transition-all duration-200 underline decoration-coral/30 decoration-[0.5px] underline-offset-4 opacity-80 hover:opacity-100"
              >
                이용약관
              </a>
            </li>
            <li>
              <a 
                href="/docs/privacy" 
                className="hover:text-coral transition-all duration-200 underline decoration-coral/30 decoration-[0.5px] underline-offset-4 opacity-80 hover:opacity-100"
              >
                개인정보 처리방침
              </a>
            </li>
            <li className="text-[11px] text-cream/40 mt-3 max-w-none leading-relaxed font-normal flex flex-row items-start lg:justify-end gap-x-1.5" style={{ whiteSpace: "nowrap" }}>
              <span className="text-coral font-bold shrink-0">클코클라우드 NOTIFY :</span>
              <div className="flex flex-col text-left">
                <span>본 서비스는 Anthropic 서비스가 아니며</span>
                <span>공식 클로드코드와 호환되는 클로드 API 키 발급/잔액 관리 서비스입니다.</span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="container-cinematic mt-14 border-t border-white/10 pt-6 text-sm text-cream/42">
        ⓒ 2026 클코클라우드. 모든 권리 보유.
      </div>
    </footer>
  );
}
