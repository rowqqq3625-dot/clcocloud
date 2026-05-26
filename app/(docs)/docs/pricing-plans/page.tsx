import type { Metadata } from "next";
import Link from "next/link";
import { DocsArticle } from "@/components/docs/DocsArticle";

export const metadata: Metadata = {
  title: "충전형 요금제 세부 정책",
  description: "요금제별 충전 혜택 및 장기 미접속 시의 잔액 유지 조건 등 요금 정책 상세 확인.",
  alternates: { canonical: "/docs/pricing-plans" },
  openGraph: {
    title: "충전형 요금제 세부 정책",
    description: "요금제별 충전 혜택 및 장기 미접속 시의 잔액 유지 조건 등 요금 정책 상세 확인.",
    images: ["/og-logo.jpg"]
  }
};

const headings = [
  { id: "plans", title: "플랜", level: 2 as const },
  { id: "model-pricing", title: "모델가격", level: 2 as const },
  { id: "balance", title: "잔액 기준", level: 2 as const }
];

export default function PricingPlansPage() {
  return (
    <DocsArticle pathname="/docs/pricing-plans" headings={headings}>
      <h1>요금제</h1>
      <p className="lead">문서에서는 플랜 선택 기준과 토큰 비용 구조만 짧게 정리합니다.</p>
      <h2 id="plans">플랜</h2>
      <div className="docs-mini-plan-grid">
        <article><strong>Starter</strong><span>초기 테스트와 단일 장비 세팅 확인</span></article>
        <article><strong>Standard</strong><span>개인 개발자의 일상적인 클로드코드 CLI 사용</span></article>
        <article><strong>Pro</strong><span>긴 세션과 팀 단위 사용량을 고려한 플랜</span></article>
      </div>
      <p>
        구매는 <Link href="/checkout?plan=standard">플랜 선택 화면</Link>에서 진행합니다.
      </p>
      <h2 id="model-pricing">모델가격</h2>
      <p>
        모델별 입력/출력 토큰 가격은 Anthropic 공식 가격표를 기준으로 별도 정리했습니다. 자세한 표는{" "}
        <Link href="/docs/model-pricing">모델가격</Link> 문서에서 확인하세요.
      </p>
      <h2 id="balance">잔액 기준</h2>
      <p>잔액은 실제 모델, 입력 토큰, 출력 토큰, 캐시 사용 여부에 따라 줄어듭니다. 운영 중에는 대시보드에서 키 상태를 먼저 확인하세요.</p>
    </DocsArticle>
  );
}
