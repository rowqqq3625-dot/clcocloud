import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsArticle } from "@/components/docs/DocsArticle";
import { MACOS_CODE } from "@/lib/docs/snippets";

export const metadata: Metadata = { title: "macOS 설치", alternates: { canonical: "/docs/installation/macos" } };
const headings = [{ id: "macos", title: "macOS", level: 2 as const }];

export default function MacOSPage() {
  return (
    <DocsArticle pathname="/docs/installation/macos" headings={headings}>
      <h1>macOS</h1>
      <p className="lead">zsh 환경에서 클코클라우드 엔드포인트와 인증 토큰을 설정합니다.</p>
      <h2 id="macos">macOS</h2>
      <CodeBlock code={MACOS_CODE} lang="bash" filename="~/.zshrc" highlightLines={[2, 3]} showLineNumbers />
    </DocsArticle>
  );
}
