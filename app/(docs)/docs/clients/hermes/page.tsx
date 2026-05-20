import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsArticle } from "@/components/docs/DocsArticle";
import { HERMES_AGENT_CONFIG } from "@/lib/docs/snippets";

export const metadata: Metadata = {
  title: "헤르메스 에이전트",
  description: "헤르메스 에이전트에 클코클라우드 Anthropic provider를 설정합니다.",
  alternates: { canonical: "/docs/clients/hermes" }
};

const headings = [{ id: "settings", title: "헤르메스 에이전트 설정", level: 2 as const }];

export default function HermesClientPage() {
  return (
    <DocsArticle pathname="/docs/clients/hermes" headings={headings}>
      <h1>헤르메스 에이전트</h1>
      <p className="lead">헤르메스 에이전트의 Anthropic provider 설정에 endpoint와 token을 지정합니다.</p>
      <h2 id="settings">헤르메스 에이전트 설정</h2>
      <CodeBlock lang="yaml" filename="hermes-agent.yaml" code={HERMES_AGENT_CONFIG} showLineNumbers highlightLines={[1, 2]} />
    </DocsArticle>
  );
}
