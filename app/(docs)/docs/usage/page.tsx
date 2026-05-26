import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsArticle } from "@/components/docs/DocsArticle";

export const metadata: Metadata = {
  title: "CLI 기본 명령어와 사용법",
  description: "터미널에서 클로드코드 CLI를 다루는 코어 명령어 및 비용 효율적인 토큰 절약법.",
  alternates: { canonical: "/docs/usage" },
  openGraph: {
    title: "CLI 기본 명령어와 사용법",
    description: "터미널에서 클로드코드 CLI를 다루는 코어 명령어 및 비용 효율적인 토큰 절약법.",
    images: ["/og-logo.jpg"]
  }
};

const headings = [
  { id: "start", title: "시작", level: 2 as const },
  { id: "commands", title: "자주 쓰는 명령어", level: 2 as const }
];

const commands = [
  ["세션 비우기", "/clear", "현재 대화 맥락을 비우고 새 작업을 시작합니다."],
  ["대화 압축", "/compact", "긴 대화를 압축해 이어갈 수 있게 정리합니다."],
  ["컨텍스트 확인", "/context", "현재 작업에 들어온 파일과 맥락을 확인합니다."],
  ["추론 강도 설정", "/effort", "응답에 사용할 추론 강도를 조절합니다."],
  ["목표 설정", "/goal", "현재 세션의 목표를 명확하게 고정합니다."],
  ["도움말 보기", "/help", "사용 가능한 명령어와 도움말을 확인합니다."],
  ["MCP 연결 확인", "/mcp", "연결된 MCP 도구와 서버 상태를 확인합니다."],
  ["모델 변경", "/model", "작업에 사용할 모델을 바꿉니다."],
  ["작업 계획", "/plan", "구현 전에 작업 계획을 정리합니다."],
  ["세션 이어가기", "/resume", "이전 세션이나 중단된 작업을 이어갑니다."],
  ["스킬 사용", "/skill", "사용 가능한 스킬을 확인하거나 불러옵니다."],
  ["작업 대상 지정", "/use", "특정 파일, 폴더, 맥락을 작업 대상으로 지정합니다."],
  ["디버그 모드", "/debug", "문제 원인을 좁히기 위한 진단 흐름을 시작합니다."],
  ["프로젝트 초기화", "/init", "새 프로젝트의 기본 맥락과 지침을 초기화합니다."],
  ["보안 리뷰", "/security-review", "보안 관점에서 코드와 설정을 점검합니다."],
  ["CLI 종료", "exit", "CLI 세션을 종료합니다."]
];

export default function UsagePage() {
  return (
    <DocsArticle pathname="/docs/usage" headings={headings}>
      <h1>사용법</h1>
      <p className="lead">클로드코드 CLI에서 자주 쓰는 명령어만 순서대로 정리했습니다.</p>
      <h2 id="start">시작</h2>
      <CodeBlock lang="bash" code={`claude
claude --version`} showLineNumbers highlightLines={[1, 2]} />
      <h2 id="commands">자주 쓰는 명령어</h2>
      <table className="docs-table docs-command-table">
        <thead>
          <tr><th>기능</th><th>입력</th><th>설명</th></tr>
        </thead>
        <tbody>
          {commands.map(([label, command, description]) => (
            <tr key={label}><td>{label}</td><td><code>{command}</code></td><td>{description}</td></tr>
          ))}
        </tbody>
      </table>
    </DocsArticle>
  );
}
