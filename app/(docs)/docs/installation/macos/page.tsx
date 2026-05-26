import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsArticle } from "@/components/docs/DocsArticle";
import { MACOS_CODE } from "@/lib/docs/snippets";

export const metadata: Metadata = {
  title: "macOS CLI 설치 방법",
  description: "맥 터미널 및 홈브루 환경에 최적화된 안정적인 클로드코드 패키지 셋업 가이드.",
  alternates: { canonical: "/docs/installation/macos" },
  openGraph: {
    title: "macOS CLI 설치 방법",
    description: "맥 터미널 및 홈브루 환경에 최적화된 안정적인 클로드코드 패키지 셋업 가이드.",
    images: ["/og-logo.jpg"]
  }
};
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
