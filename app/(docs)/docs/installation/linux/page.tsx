import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsArticle } from "@/components/docs/DocsArticle";
import { LINUX_CODE } from "@/lib/docs/snippets";

export const metadata: Metadata = { title: "Linux 설치", alternates: { canonical: "/docs/installation/linux" } };
const headings = [{ id: "linux", title: "Linux", level: 2 as const }];

export default function LinuxPage() {
  return (
    <DocsArticle pathname="/docs/installation/linux" headings={headings}>
      <h1>Linux</h1>
      <p className="lead">bash 환경에서 클코클라우드 엔드포인트와 인증 토큰을 설정합니다.</p>
      <h2 id="linux">Linux</h2>
      <CodeBlock code={LINUX_CODE} lang="bash" filename="~/.bashrc" highlightLines={[2, 3]} showLineNumbers />
    </DocsArticle>
  );
}
