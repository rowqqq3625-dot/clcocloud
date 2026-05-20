import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsArticle } from "@/components/docs/DocsArticle";
import { AGENT_INSTALL_COMMAND } from "@/lib/docs/snippets";

export const metadata: Metadata = {
  title: "외부 에이전트 연동",
  description: "외부 에이전트에 클코클라우드 설정을 읽히는 공통 연동 프롬프트입니다.",
  alternates: { canonical: "/docs/agent-integration" }
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
