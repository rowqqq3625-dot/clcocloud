import type { Metadata } from "next";
import Link from "next/link";
import { Callout } from "@/components/docs/Callout";
import { DocsArticle } from "@/components/docs/DocsArticle";

export const metadata: Metadata = {
  title: "API 키 관리 및 보관",
  description: "발급받은 API 키의 안전한 보관 수칙과 실시간 잔액 연계 로직을 설명합니다.",
  alternates: { canonical: "/docs/api-key" },
  openGraph: {
    title: "API 키 관리 및 보관",
    description: "발급받은 API 키의 안전한 보관 수칙과 실시간 잔액 연계 로직을 설명합니다.",
    images: ["/og-logo.jpg"]
  }
};

const headings = [
  { id: "format", title: "키 형식", level: 2 as const },
  { id: "issue", title: "발급 절차", level: 2 as const },
  { id: "manage", title: "키 관리", level: 2 as const },
  { id: "next", title: "다음 단계", level: 2 as const }
];

export default function ApiKeyPage() {
  return (
    <DocsArticle pathname="/docs/api-key" headings={headings}>
      <h1>API 키 발급</h1>
      <h2 id="format">키 형식</h2>
      <p>
        클코클라우드 API 키는 <code>sk-ant-api03-xxxxxxxxx</code> 형식을 사용합니다.
      </p>
      <h2 id="issue">발급 절차</h2>
      <ol>
        <li>플랜을 선택하고 결제를 완료합니다.</li>
        <li>마이페이지에서 주문 상태가 발급완료인지 확인합니다.</li>
        <li>발급 안내로 전달된 키를 안전한 곳에 저장합니다.</li>
        <li>대시보드에서 키 상태와 잔액을 확인합니다.</li>
      </ol>
      <Callout variant="warn">API 키는 계정과 구매내역에 연결됩니다. 분실했거나 노출이 의심되면 기존 키 사용을 중단하고 지원으로 재발급을 요청하세요.</Callout>
      <h2 id="manage">키 관리</h2>
      <p>
        실제 사용은 마이페이지의 구매내역과 대시보드의 키 상태 조회를 기준으로 관리합니다. 키 원문은 코드 저장소에 넣지 말고,
        환경 변수에만 저장하세요. 여러 장비에서 같은 키를 쓸 때는 마지막으로 설정한 장비와 셸을 기록해 두는 편이 안전합니다.
      </p>
      <h2 id="next">다음 단계</h2>
      <p>
        키를 발급했다면 <Link href="/docs/environment-variables">환경 변수 설정 페이지</Link>로 이동합니다.
      </p>
    </DocsArticle>
  );
}
