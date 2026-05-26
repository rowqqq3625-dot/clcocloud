import type { Metadata } from "next";
import Link from "next/link";
import { DocsArticle } from "@/components/docs/DocsArticle";

export const metadata: Metadata = {
  title: "AI 모델별 토큰 단가 명세",
  description: "3.5 Sonnet, 3.5 Haiku, 3 Opus 등 공식 모델 호출 시 발생하는 토큰 차감 가격표.",
  alternates: { canonical: "/docs/model-pricing" },
  openGraph: {
    title: "AI 모델별 토큰 단가 명세",
    description: "3.5 Sonnet, 3.5 Haiku, 3 Opus 등 공식 모델 호출 시 발생하는 토큰 차감 가격표.",
    images: ["/og-logo.jpg"]
  }
};

const headings = [
  { id: "official", title: "모델별 가격", level: 2 as const },
  { id: "plans", title: "클코클라우드 플랜", level: 2 as const }
];

export default function ModelPricingPage() {
  return (
    <DocsArticle pathname="/docs/model-pricing" headings={headings}>
      <h1>모델가격</h1>
      <p className="lead">자주 쓰는 세 모델만 남겼습니다. 금액은 USD 기준이며 MTok은 백만 토큰입니다.</p>
      <h2 id="official">모델별 가격</h2>
      <table className="docs-table">
        <thead>
          <tr><th>모델</th><th>입력</th><th>출력</th><th>추천 용도</th></tr>
        </thead>
        <tbody>
          <tr><td>오푸스 4.7</td><td>$5 / MTok</td><td>$25 / MTok</td><td>가장 어려운 설계, 장문 분석, 고난도 코드 리뷰</td></tr>
          <tr><td>소넷 4.6</td><td>$3 / MTok</td><td>$15 / MTok</td><td>일상적인 개발, 리팩터링, 문서 작성</td></tr>
          <tr><td>하이쿠 4.5</td><td>$1 / MTok</td><td>$5 / MTok</td><td>빠른 질의, 가벼운 수정, 반복 작업</td></tr>
        </tbody>
      </table>
      <p>
        출처: <a href="https://platform.claude.com/docs/en/about-claude/pricing" target="_blank" rel="noreferrer">Anthropic Pricing</a>
      </p>
      <h2 id="plans">클코클라우드 플랜</h2>
      <div className="docs-mini-plan-grid">
        <article><strong>Starter</strong><span>가벼운 테스트와 개인 세팅 검증</span></article>
        <article><strong>Standard</strong><span>일상적인 클로드코드 CLI 사용</span></article>
        <article><strong>Pro</strong><span>팀 단위 작업과 잦은 장시간 세션</span></article>
      </div>
      <p>
        실제 구매는 <Link href="/checkout?plan=standard">플랜 선택 화면</Link>에서 진행합니다.
      </p>
    </DocsArticle>
  );
}
