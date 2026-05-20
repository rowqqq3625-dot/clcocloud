import type { Metadata } from "next";
import { DocsArticle } from "@/components/docs/DocsArticle";

export const metadata: Metadata = {
  title: "환경 변수 레퍼런스",
  description: "클코클라우드 연동에 필요한 환경 변수와 예시값입니다.",
  alternates: { canonical: "/docs/environment-variables" }
};

const headings = [{ id: "table", title: "환경 변수", level: 2 as const }];

export default function EnvironmentVariablesPage() {
  return (
    <DocsArticle pathname="/docs/environment-variables" headings={headings}>
      <h1>환경 변수 레퍼런스</h1>
      <p className="lead">클로드코드 CLI와 외부 에이전트가 클코클라우드로 요청을 보내기 위해 읽는 값입니다.</p>
      <h2 id="table">환경 변수</h2>
      <table className="docs-table">
        <thead>
          <tr>
            <th>변수명</th>
            <th>필수</th>
            <th>설명</th>
            <th>예시값</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>ANTHROPIC_BASE_URL</code></td>
            <td><span className="docs-chip docs-chip-required">필수</span></td>
            <td>요청이 엔트로픽 엔드포인트로 향하도록 BASE_URL을 지정합니다.</td>
            <td><code>https://api-anthropic.com/v1</code></td>
          </tr>
          <tr>
            <td><code>ANTHROPIC_AUTH_TOKEN</code></td>
            <td><span className="docs-chip docs-chip-required">필수</span></td>
            <td>구매 후 발급받은 인증 키입니다. 코드 저장소가 아니라 셸 환경 변수에만 저장하세요.</td>
            <td><code>sk-ant-api03-xxxxxxxxx</code></td>
          </tr>
          <tr>
            <td><code>CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC</code></td>
            <td><span className="docs-chip docs-chip-recommended">권장</span></td>
            <td>클로드코드 CLI의 불필요한 원격 트래픽을 줄이는 권장 설정입니다.</td>
            <td><code>1</code></td>
          </tr>
          <tr>
            <td><code>ANTHROPIC_API_KEY</code></td>
            <td><span className="docs-chip docs-chip-remove">제거</span></td>
            <td>기존 API 키입니다. 남아 있으면 새 설정보다 먼저 사용될 수 있어 제거합니다.</td>
            <td><code>(없음)</code></td>
          </tr>
        </tbody>
      </table>
    </DocsArticle>
  );
}
