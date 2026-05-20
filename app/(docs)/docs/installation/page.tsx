import type { Metadata } from "next";
import { Callout } from "@/components/docs/Callout";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsArticle } from "@/components/docs/DocsArticle";
import { OSTabs } from "@/components/docs/OSTabs";
import { CLAUDE_CODE_INSTALL, OS_TABS } from "@/lib/docs/snippets";

export const metadata: Metadata = {
  title: "클로드코드CLI",
  description: "클로드코드CLI 설치와 OS별 환경 변수 설정입니다.",
  alternates: { canonical: "/docs/installation" }
};

const headings = [
  { id: "install", title: "CLI 설치", level: 2 as const },
  { id: "environment", title: "환경 변수 설정", level: 2 as const },
  { id: "meaning", title: "환경변수 코드는 무엇을 의미하나요?", level: 3 as const }
];

export default function InstallationPage() {
  return (
    <DocsArticle pathname="/docs/installation" headings={headings}>
      <h1>클로드코드CLI</h1>
      <p className="lead">CLI를 설치하고, 사용하는 운영체제에 맞는 환경 변수만 복사해 적용합니다.</p>
      <h2 id="install">CLI 설치</h2>
      <CodeBlock lang="bash" filename="install" code={CLAUDE_CODE_INSTALL} showLineNumbers highlightLines={[1]} />
      <h2 id="environment">환경 변수 설정</h2>
      <OSTabs tabs={OS_TABS} storageKey="docs:installation-os" />
      <h3 id="meaning">환경변수 코드는 무엇을 의미하나요?</h3>
      <ol>
        <li>기존 API 키가 먼저 잡히지 않도록 제거합니다.</li>
        <li>요청이 엔트로픽 엔드포인트로 향하도록 BASE_URL을 지정합니다.</li>
        <li>발급받은 키를 AUTH_TOKEN에 넣어 인증합니다.</li>
        <li>불필요한 원격 트래픽을 줄이고 기존 CLI 세션을 정리합니다.</li>
      </ol>
      <Callout variant="tip">&quot;여기에_발급받은_API키를 넣어주세요.&quot; 자리에 발급받은 <code>sk-ant-api03-xxxxxxxxx</code> 형식의 키를 넣으세요.</Callout>
    </DocsArticle>
  );
}
