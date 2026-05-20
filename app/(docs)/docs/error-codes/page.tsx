import type { Metadata } from "next";
import { DocsArticle } from "@/components/docs/DocsArticle";

export const metadata: Metadata = {
  title: "오류코드",
  description: "클코클라우드 연동 중 마주치는 주요 HTTP 오류코드 설명입니다.",
  alternates: { canonical: "/docs/error-codes" }
};

const headings = [{ id: "codes", title: "주요 오류코드", level: 2 as const }];

const rows = [
  ["400", "요청 형식 오류", "model, messages, header 형식을 확인합니다."],
  ["401", "인증 실패", "ANTHROPIC_AUTH_TOKEN 값과 키 공백 여부를 확인합니다."],
  ["403", "권한 또는 정책 차단", "키 상태, 플랜, 허용 모델 범위를 확인합니다."],
  ["404", "경로 오류", "endpoint가 https://api-anthropic.com/v1 인지 확인합니다."],
  ["408", "요청 시간 초과", "네트워크 상태와 요청 크기를 줄여 재시도합니다."],
  ["429", "요청량 제한", "짧은 시간 반복 호출을 줄이고 백오프를 적용합니다."],
  ["500", "서버 내부 오류", "동일 요청 재시도 전 요청 ID와 시간을 기록합니다."],
  ["502", "상위 모델 게이트웨이 오류", "잠시 후 재시도하고 장시간 지속되면 지원에 전달합니다."],
  ["503", "일시적 사용 불가", "서비스 상태 또는 모델 혼잡 가능성을 확인합니다."],
  ["504", "게이트웨이 시간 초과", "긴 컨텍스트를 줄이고 재시도 간격을 둡니다."]
];

export default function ErrorCodesPage() {
  return (
    <DocsArticle pathname="/docs/error-codes" headings={headings}>
      <h1>오류코드</h1>
      <p className="lead">오류는 먼저 인증, endpoint, 요청량, 네트워크 순서로 좁히면 빠르게 원인을 찾을 수 있습니다.</p>
      <h2 id="codes">주요 오류코드</h2>
      <table className="docs-table">
        <thead><tr><th>코드</th><th>의미</th><th>바로 확인할 것</th></tr></thead>
        <tbody>
          {rows.map(([code, meaning, check]) => (
            <tr key={code}><td><code>{code}</code></td><td>{meaning}</td><td>{check}</td></tr>
          ))}
        </tbody>
      </table>
    </DocsArticle>
  );
}
