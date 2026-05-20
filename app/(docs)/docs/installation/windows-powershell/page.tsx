import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsArticle } from "@/components/docs/DocsArticle";
import { PS_CODE } from "@/lib/docs/snippets";

export const metadata: Metadata = {
  title: "Windows PowerShell 설치",
  alternates: { canonical: "/docs/installation/windows-powershell" }
};
const headings = [{ id: "powershell", title: "Windows PowerShell", level: 2 as const }];

export default function WindowsPowerShellPage() {
  return (
    <DocsArticle pathname="/docs/installation/windows-powershell" headings={headings}>
      <h1>Windows PowerShell</h1>
      <p className="lead">사용자 환경 변수에 클코클라우드 엔드포인트와 인증 토큰을 저장합니다.</p>
      <h2 id="powershell">Windows PowerShell</h2>
      <CodeBlock code={PS_CODE} lang="powershell" filename="PowerShell" highlightLines={[2, 3]} showLineNumbers />
    </DocsArticle>
  );
}
