import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { DocsArticle } from "@/components/docs/DocsArticle";

export const metadata: Metadata = {
  title: "사용량 모니터링",
  description: "클코클라우드 대시보드에서 키 상태와 사용량을 확인합니다.",
  alternates: { canonical: "/docs/usage-monitoring" }
};

const headings = [
  { id: "dashboard", title: "대시보드로 이동", level: 2 as const },
  { id: "checklist", title: "확인 항목", level: 2 as const }
];

export default function UsageMonitoringPage() {
  return (
    <DocsArticle pathname="/docs/usage-monitoring" headings={headings}>
      <h1>사용량 모니터링</h1>
      <p className="lead">API 키 잔액, 최근 조회 상태, 사용 흐름은 대시보드에서 확인합니다.</p>
      <h2 id="dashboard">대시보드로 이동</h2>
      <a className="docs-action-card docs-action-card-primary" href="/dashboard">
        <BarChart3 size={20} aria-hidden="true" />
        <span>
          <strong>대시보드에서 사용량 확인</strong>
          <small>키를 입력하면 잔액과 상태를 바로 확인할 수 있습니다.</small>
        </span>
      </a>
      <h2 id="checklist">확인 항목</h2>
      <ul>
        <li>키가 올바른 구매 계정에 연결되어 있는지 확인합니다.</li>
        <li>잔액 부족과 인증 실패를 분리해 봅니다.</li>
        <li>429 또는 502가 반복되면 호출 간격과 요청 크기를 함께 줄입니다.</li>
      </ul>
    </DocsArticle>
  );
}
