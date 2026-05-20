import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsArticle } from "@/components/docs/DocsArticle";
import { N8N_CONFIG } from "@/lib/docs/snippets";

export const metadata: Metadata = {
  title: "n8n",
  description: "n8n 워커에 클코클라우드 환경 변수를 주입합니다.",
  alternates: { canonical: "/docs/clients/n8n" }
};

const headings = [{ id: "settings", title: "n8n 설정", level: 2 as const }];

export default function N8nClientPage() {
  return (
    <DocsArticle pathname="/docs/clients/n8n" headings={headings}>
      <h1>n8n</h1>
      <p className="lead">환경 변수 방식으로 실행하는 n8n 워커에는 아래 두 값을 주입합니다.</p>
      <h2 id="settings">n8n 설정</h2>
      <CodeBlock lang="bash" filename=".env" code={N8N_CONFIG} showLineNumbers highlightLines={[1, 2]} />
    </DocsArticle>
  );
}
