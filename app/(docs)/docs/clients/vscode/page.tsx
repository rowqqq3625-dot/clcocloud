import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsArticle } from "@/components/docs/DocsArticle";
import { VSCODE_CONFIG } from "@/lib/docs/snippets";

export const metadata: Metadata = {
  title: "VS코드",
  description: "VS코드 확장에서 클코클라우드 endpoint를 사용합니다.",
  alternates: { canonical: "/docs/clients/vscode" }
};

const headings = [{ id: "settings", title: "VS코드 설정", level: 2 as const }];

export default function VscodeClientPage() {
  return (
    <DocsArticle pathname="/docs/clients/vscode" headings={headings}>
      <h1>VS코드</h1>
      <p className="lead">VS코드 확장의 Anthropic provider 설정에 클코클라우드 endpoint와 인증 키를 입력합니다.</p>
      <h2 id="settings">VS코드 설정</h2>
      <CodeBlock lang="json" filename="settings.json" code={VSCODE_CONFIG} showLineNumbers highlightLines={[2, 3]} />
    </DocsArticle>
  );
}
