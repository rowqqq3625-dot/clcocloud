import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsArticle } from "@/components/docs/DocsArticle";
import { OPENCODE_CONFIG } from "@/lib/docs/snippets";

export const metadata: Metadata = {
  title: "오픈코드",
  description: "오픈코드 provider 설정에 클코클라우드를 연결합니다.",
  alternates: { canonical: "/docs/clients/opencode" }
};

const headings = [{ id: "settings", title: "오픈코드 설정", level: 2 as const }];

export default function OpencodeClientPage() {
  return (
    <DocsArticle pathname="/docs/clients/opencode" headings={headings}>
      <h1>오픈코드</h1>
      <p className="lead">provider 설정에서 Anthropic API 주소와 키를 클코클라우드 값으로 바꿉니다.</p>
      <h2 id="settings">오픈코드 설정</h2>
      <CodeBlock lang="json" filename="opencode.json" code={OPENCODE_CONFIG} showLineNumbers highlightLines={[4, 5]} />
    </DocsArticle>
  );
}
