import type { Metadata } from "next";
import { Callout } from "@/components/docs/Callout";
import { DocsArticle } from "@/components/docs/DocsArticle";

export const metadata: Metadata = {
  title: "시스템 트러블슈팅",
  description: "네트워크 연결 불안정, 키 로딩 오류 등 실무 개발자 환경의 장애 해결 방법 총망라.",
  alternates: { canonical: "/docs/troubleshooting" },
  openGraph: {
    title: "시스템 트러블슈팅",
    description: "네트워크 연결 불안정, 키 로딩 오류 등 실무 개발자 환경의 장애 해결 방법 총망라.",
    images: ["/og-logo.jpg"]
  }
};

const headings = [
  { id: "invalid-api-key", title: "Invalid API key", level: 3 as const },
  { id: "base-url", title: "BASE_URL 미반영", level: 3 as const },
  { id: "session", title: "claude /logout 후에도 기존 세션이 살아 있음", level: 3 as const },
  { id: "setx", title: "Windows 에서 setx 가 현재 세션에 반영 안 됨", level: 3 as const },
  { id: "proxy", title: "프록시/방화벽 환경", level: 3 as const }
];

export default function TroubleshootingPage() {
  return (
    <DocsArticle pathname="/docs/troubleshooting" headings={headings}>
      <h1>문제 해결</h1>
      <p className="lead">문제는 대부분 키, endpoint, 세션, 네트워크 중 하나입니다. 아래 순서대로 확인하세요.</p>
      <h2>핵심 점검</h2>
      <h3 id="invalid-api-key">Invalid API key</h3>
      <p>원인: 기존 공식 키가 남아 있거나 <code>ANTHROPIC_AUTH_TOKEN</code> 값이 다릅니다. 해결: 공식 키를 제거하고 발급 키를 다시 넣습니다.</p>
      <h3 id="base-url">BASE_URL 미반영</h3>
      <p>원인: 새 셸에 환경변수가 반영되지 않았습니다. 해결: Linux/macOS는 source, Windows는 새 터미널을 사용합니다.</p>
      <h3 id="session">claude /logout 후에도 기존 세션이 살아 있음</h3>
      <p>원인: 다른 터미널의 CLI 세션이나 캐시가 남아 있습니다. 해결: 모든 세션을 닫고 새 터미널에서 다시 시작합니다.</p>
      <h3 id="setx">Windows 에서 setx 가 현재 세션에 반영 안 됨</h3>
      <p>원인: <code>setx</code>는 다음 셸부터 적용됩니다. 해결: Command Prompt 또는 PowerShell을 완전히 닫고 다시 엽니다.</p>
      <h3 id="proxy">프록시/방화벽 환경</h3>
      <p>원인: 회사망, 보안 프록시, DNS 정책이 <code>https://api-anthropic.com/v1</code> 연결을 막을 수 있습니다.</p>
      <Callout variant="danger">프록시 환경에서는 endpoint 허용 여부와 TLS 검사 정책을 먼저 확인하세요.</Callout>
    </DocsArticle>
  );
}
