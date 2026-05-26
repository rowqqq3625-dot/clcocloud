import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsArticle } from "@/components/docs/DocsArticle";
import { OPENCODE_CONFIG } from "@/lib/docs/snippets";

export const metadata: Metadata = {
  title: "OpenCode 클라이언트 연동",
  description: "커뮤니티형 개발 툴 OpenCode의 API 호출 규격을 클코 클라우드에 맞추는 세팅법.",
  alternates: { canonical: "/docs/clients/opencode" },
  openGraph: {
    title: "OpenCode 클라이언트 연동",
    description: "커뮤니티형 개발 툴 OpenCode의 API 호출 규격을 클코 클라우드에 맞추는 세팅법.",
    images: ["/og-logo.jpg"]
  }
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
