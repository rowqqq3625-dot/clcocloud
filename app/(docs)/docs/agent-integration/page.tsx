import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsArticle } from "@/components/docs/DocsArticle";
import { AGENT_INSTALL_COMMAND } from "@/lib/docs/snippets";

export const metadata: Metadata = {
  title: "외부 에이전트 연동 가이드",
  description: "Cursor, VS Code 등 타사 에디터와 클코 API를 연동하여 성능을 200% 끌어올리는 팁.",
  alternates: { canonical: "/docs/agent-integration" },
  openGraph: {
    title: "외부 에이전트 연동 가이드",
    description: "Cursor, VS Code 등 타사 에디터와 클코 API를 연동하여 성능을 200% 끌어올리는 팁.",
    images: ["/og-logo.jpg"]
  }
};

const headings = [{ id: "prompt", title: "공통 연동 프롬프트", level: 2 as const }];

export default function AgentIntegrationPage() {
  return (
    <DocsArticle pathname="/docs/agent-integration" headings={headings}>
      <h1>외부 에이전트 연동</h1>
      <p className="lead">에이전트가 클코클라우드 설정 문서를 직접 읽고 필요한 환경 설정을 진행하도록 만드는 단일 프롬프트입니다.</p>
      <h2 id="prompt">공통 연동 프롬프트</h2>
      <CodeBlock lang="text" filename="agent prompt" code={AGENT_INSTALL_COMMAND} showLineNumbers highlightLines={[1]} />
    </DocsArticle>
  );
}
