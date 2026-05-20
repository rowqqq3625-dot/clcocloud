import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsArticle } from "@/components/docs/DocsArticle";
import { HERMES_AGENT_CONFIG } from "@/lib/docs/snippets";

export const metadata: Metadata = {
  title: "오픈클로",
  description: "오픈클로에서 클코클라우드 endpoint와 token을 설정합니다.",
  alternates: { canonical: "/docs/clients/openclaw" }
};

const headings = [{ id: "settings", title: "오픈클로 설정", level: 2 as const }];

export default function OpenclawClientPage() {
  return (
    <DocsArticle pathname="/docs/clients/openclaw" headings={headings}>
      <h1>오픈클로</h1>
      <p className="lead">Anthropic 호환 endpoint와 token 입력란에 클코클라우드 값을 넣습니다.</p>
      <h2 id="settings">오픈클로 설정</h2>
      <CodeBlock lang="yaml" filename="openclaw.yaml" code={HERMES_AGENT_CONFIG} showLineNumbers highlightLines={[1, 2]} />
    </DocsArticle>
  );
}
