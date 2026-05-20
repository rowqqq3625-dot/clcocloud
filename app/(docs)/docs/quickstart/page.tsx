import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsArticle } from "@/components/docs/DocsArticle";
import { OSTabs } from "@/components/docs/OSTabs";
import { PurchaseAwareApiKeyButton } from "@/components/docs/PurchaseAwareApiKeyButton";
import { OS_TABS } from "@/lib/docs/snippets";

export const metadata: Metadata = {
  title: "빠른시작",
  description: "결제, API 키 발급, 환경변수 설정, 클로드 코드 실행까지.",
  alternates: { canonical: "/docs/quickstart" }
};

const headings = [
  { id: "api-key", title: "1. API 키 준비", level: 2 as const },
  { id: "environment", title: "2. OS에 맞게 환경 변수 설정", level: 2 as const },
  { id: "verify", title: "3. 동작 확인", level: 2 as const }
];

export default function QuickStartPage() {
  return (
    <DocsArticle pathname="/docs/quickstart" headings={headings}>
      <h1>빠른시작</h1>
      <p className="lead">결제 → API 키 발급 → 환경변수 설정 → 클로드 코드 실행까지.</p>
      <h2 id="api-key">1. API 키 준비</h2>
      <p>구매 내역이 있으면 마이페이지의 API 키 구매내역으로 이동하고, 아직 구매하지 않았다면 플랜 선택 화면으로 이동합니다.</p>
      <PurchaseAwareApiKeyButton />
      <h2 id="environment">2. OS에 맞게 환경 변수 설정</h2>
      <OSTabs tabs={OS_TABS} storageKey="docs:quickstart-os" />
      <h2 id="verify">3. 동작 확인</h2>
      <CodeBlock lang="bash" code={`claude --version`} showLineNumbers highlightLines={[1]} />
    </DocsArticle>
  );
}
