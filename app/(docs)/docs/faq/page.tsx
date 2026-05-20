import type { Metadata } from "next";
import { DocsArticle } from "@/components/docs/DocsArticle";

export const metadata: Metadata = { title: "FAQ", description: "클코클라우드 개발자용 Q&A입니다.", alternates: { canonical: "/docs/faq" } };

const headings = [{ id: "developer-faq", title: "개발자용 Q&A", level: 2 as const }];

export default function FAQPage() {
  return (
    <DocsArticle pathname="/docs/faq" headings={headings}>
      <h1>FAQ</h1>
      <p className="lead">개발자가 연동 중 가장 자주 막히는 질문만 남겼습니다.</p>
      <h2 id="developer-faq">개발자용 Q&A</h2>
      <div className="docs-faq">
        <details>
          <summary>기존 ANTHROPIC_API_KEY를 꼭 제거해야 하나요?</summary>
          <p>네. 공식 키가 남아 있으면 CLI가 클코클라우드 설정 대신 기존 키를 우선 사용할 수 있습니다.</p>
        </details>
        <details>
          <summary>BASE_URL은 어떤 값이어야 하나요?</summary>
          <p><code>https://api-anthropic.com/v1</code> 값을 사용합니다.</p>
        </details>
        <details>
          <summary>Windows에서 명령어를 실행했는데 바로 반영되지 않습니다.</summary>
          <p>setx는 새 셸부터 반영됩니다. 터미널을 닫고 다시 여세요.</p>
        </details>
        <details>
          <summary>커서나 VS코드 확장이 자동 설정을 못 하면 어떻게 하나요?</summary>
          <p>클라이언트 연동 문서의 endpoint와 token 값을 수동으로 넣으면 됩니다.</p>
        </details>
        <details>
          <summary>키 구매내역은 어디서 확인하나요?</summary>
          <p>마이페이지의 API 키 구매내역 영역에서 확인합니다. 구매 내역이 없으면 플랜 선택 화면으로 이동합니다.</p>
        </details>
        <details>
          <summary>429가 반복되면 어떻게 해야 하나요?</summary>
          <p>동시 요청 수와 재시도 간격을 줄이고, 긴 컨텍스트 요청을 나눠서 보내세요.</p>
        </details>
      </div>
    </DocsArticle>
  );
}
