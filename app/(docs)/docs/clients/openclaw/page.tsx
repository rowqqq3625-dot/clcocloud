import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsArticle } from "@/components/docs/DocsArticle";
import { HERMES_AGENT_CONFIG } from "@/lib/docs/snippets";

export const metadata: Metadata = {
  title: "OpenClaw 클라이언트 연동",
  description: "오픈소스 코딩 도구 OpenClaw와 클코 API를 오차 없이 매칭하는 상세 가이드.",
  alternates: { canonical: "/docs/clients/openclaw" },
  openGraph: {
    title: "OpenClaw 클라이언트 연동",
    description: "오픈소스 코딩 도구 OpenClaw와 클코 API를 오차 없이 매칭하는 상세 가이드.",
    images: ["/og-logo.jpg"]
  }
};

const headings = [{ id: "settings", title: "오픈클로 설정", level: 2 as const }];

export default function OpenclawClientPage() {
  return (
    <DocsArticle pathname="/docs/clients/openclaw" headings={headings}>
      <h1>오픈클로</h1>
      <p className="lead">Anthropic 호환 endpoint와 token 입력란에 클코클라우드 값을 넣습니다.</p>
      <h2 id="settings">오픈클로 설정</h2>
      <CodeBlock lang="yaml" filename="openclaw.yaml" code={HERMES_AGENT_CONFIG} showLineNumbers highlightLines={[1, 2]} />
    </DocsArticle>
  );
}
