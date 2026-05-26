import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsArticle } from "@/components/docs/DocsArticle";
import { VSCODE_CONFIG } from "@/lib/docs/snippets";

export const metadata: Metadata = {
  title: "VS Code 확장 도구 연동",
  description: "비주얼 스튜디오 코드의 최신 AI 확장 프로그램들에 클코 API를 연계하는 가이드.",
  alternates: { canonical: "/docs/clients/vscode" },
  openGraph: {
    title: "VS Code 확장 도구 연동",
    description: "비주얼 스튜디오 코드의 최신 AI 확장 프로그램들에 클코 API를 연계하는 가이드.",
    images: ["/og-logo.jpg"]
  }
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
