import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsArticle } from "@/components/docs/DocsArticle";
import { CURSOR_CONFIG } from "@/lib/docs/snippets";

export const metadata: Metadata = {
  title: "Cursor 에디터 연동 방법",
  description: "AI 기반 차세대 에디터인 Cursor에 클코 API 키를 간편하게 세팅하고 활용하는 방법.",
  alternates: { canonical: "/docs/clients/cursor" },
  openGraph: {
    title: "Cursor 에디터 연동 방법",
    description: "AI 기반 차세대 에디터인 Cursor에 클코 API 키를 간편하게 세팅하고 활용하는 방법.",
    images: ["/og-logo.jpg"]
  }
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
