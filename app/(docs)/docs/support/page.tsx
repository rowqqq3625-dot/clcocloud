import type { Metadata } from "next";
import { DocsArticle } from "@/components/docs/DocsArticle";

export const metadata: Metadata = {
  title: "고객 기술 지원 채널",
  description: "API 장애, 즉시 충전 미반영 등 긴급 상황 발생 시 1:1 전담 서포트팀과 연동하는 법.",
  alternates: { canonical: "/docs/support" },
  openGraph: {
    title: "고객 기술 지원 채널",
    description: "API 장애, 즉시 충전 미반영 등 긴급 상황 발생 시 1:1 전담 서포트팀과 연동하는 법.",
    images: ["/og-logo.jpg"]
  }
};

const headings = [
  { id: "before", title: "문의 전 확인", level: 2 as const },
  { id: "include", title: "전달할 정보", level: 2 as const },
  { id: "route", title: "문의 경로", level: 2 as const }
];

export default function SupportPage() {
  return (
    <DocsArticle pathname="/docs/support" headings={headings}>
      <h1>문의하기</h1>
      <p className="lead">지원 메일은 <code>support.clcocloud@gmail.com</code> 입니다. 재현 정보가 정확할수록 빠르게 확인할 수 있습니다.</p>
      <h2 id="before">문의 전 확인</h2>
      <p>먼저 <code>ANTHROPIC_BASE_URL</code>, <code>ANTHROPIC_AUTH_TOKEN</code>, <code>claude /logout</code> 실행 여부를 확인하세요.</p>
      <h2 id="include">전달할 정보</h2>
      <ul>
        <li>구매 계정 이메일과 주문 시각</li>
        <li>오류코드, 발생 시간, 사용한 클라이언트</li>
        <li>키 원문이 아닌 마스킹된 키 앞뒤 일부</li>
      </ul>
      <h2 id="route">문의 경로</h2>
      <p>구매내역을 확인한 뒤 <a href="mailto:support.clcocloud@gmail.com">support.clcocloud@gmail.com</a> 으로 문의하세요.</p>
    </DocsArticle>
  );
}
