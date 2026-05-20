import type { Metadata } from "next";
import Link from "next/link";
import { Download, Key, LifeBuoy, Plug, Rocket, Settings } from "lucide-react";
import { DocsArticle } from "@/components/docs/DocsArticle";

export const metadata: Metadata = {
  title: "클코클라우드 문서",
  description: "클로드 코드를 공식보다 합리적으로, 안정적으로 쓰기 위한 모든 가이드입니다.",
  alternates: { canonical: "/docs" }
};

const cards = [
  { title: "빠른시작", href: "/docs/quickstart", icon: Rocket, text: "키 준비부터 클로드코드 CLI 확인까지 가장 짧은 경로입니다." },
  { title: "API 키 발급", href: "/docs/api-key", icon: Key, text: "구매내역, 키 형식, 발급 후 관리 기준을 확인합니다." },
  { title: "클로드코드CLI", href: "/docs/installation", icon: Download, text: "CLI 설치와 운영체제별 환경 변수 설정을 한 번에 확인합니다." },
  { title: "에이전트 연동", href: "/docs/agent-integration", icon: Plug, text: "외부 에이전트에 붙여 넣을 공통 연동 프롬프트입니다." },
  { title: "환경 변수", href: "/docs/environment-variables", icon: Settings, text: "필수 변수와 제거해야 할 기존 키를 한 표로 봅니다." },
  { title: "문제 해결", href: "/docs/troubleshooting", icon: LifeBuoy, text: "자주 발생하는 인증, 세션, 프록시 문제를 정리합니다." }
];

export default function DocsIndexPage() {
  return (
    <DocsArticle pathname="/docs" headings={[]}>
      <h1>클코클라우드 개요</h1>
      <p className="lead">클로드 코드를 공식보다 합리적으로, 안정적으로 쓰기 위한 모든 가이드를 모아 두었습니다.</p>
      <div className="docs-card-grid">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link className="docs-card" href={card.href} key={card.href}>
              <Icon size={24} aria-hidden="true" />
              <strong>{card.title}</strong>
              <span>{card.text}</span>
            </Link>
          );
        })}
      </div>
    </DocsArticle>
  );
}
