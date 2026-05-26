import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsArticle } from "@/components/docs/DocsArticle";
import { CMD_CODE } from "@/lib/docs/snippets";

export const metadata: Metadata = {
  title: "Windows CMD 설치 방법",
  description: "윈도우 기본 명령 프롬프트(CMD)를 활용한 환경변수 설정 및 CLI 연동 가이드.",
  alternates: { canonical: "/docs/installation/windows-cmd" },
  openGraph: {
    title: "Windows CMD 설치 방법",
    description: "윈도우 기본 명령 프롬프트(CMD)를 활용한 환경변수 설정 및 CLI 연동 가이드.",
    images: ["/og-logo.jpg"]
  }
};
const headings = [{ id: "cmd", title: "Windows CMD", level: 2 as const }];

export default function WindowsCmdPage() {
  return (
    <DocsArticle pathname="/docs/installation/windows-cmd" headings={headings}>
      <h1>Windows CMD</h1>
      <p className="lead">Command Prompt에서 사용자 환경 변수를 설정합니다.</p>
      <h2 id="cmd">Windows CMD</h2>
      <CodeBlock code={CMD_CODE} lang="batch" filename="Command Prompt" highlightLines={[2, 3]} showLineNumbers />
    </DocsArticle>
  );
}
