import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsArticle } from "@/components/docs/DocsArticle";
import { CURSOR_CONFIG } from "@/lib/docs/snippets";

export const metadata: Metadata = {
  title: "커서",
  description: "커서에서 클코클라우드 Anthropic 호환 설정을 적용합니다.",
  alternates: { canonical: "/docs/clients/cursor" }
};

const headings = [{ id: "settings", title: "커서 설정", level: 2 as const }];

export default function CursorClientPage() {
  return (
    <DocsArticle pathname="/docs/clients/cursor" headings={headings}>
      <h1>커서</h1>
      <p className="lead">커서의 Anthropic API 설정에 클코클라우드 endpoint와 발급 키를 입력합니다.</p>
      <h2 id="settings">커서 설정</h2>
      <CodeBlock lang="json" filename="cursor settings" code={CURSOR_CONFIG} showLineNumbers highlightLines={[2, 3]} />
    </DocsArticle>
  );
}
