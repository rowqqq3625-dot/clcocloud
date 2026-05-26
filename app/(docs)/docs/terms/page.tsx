import type { Metadata } from "next";
import { DocsArticle } from "@/components/docs/DocsArticle";

export const metadata: Metadata = {
  title: "서비스 이용 약관",
  description: "클코클라우드 플랫폼을 사용하는 모든 회원 및 개발자의 권리와 서비스 이용 수칙 명시.",
  alternates: { canonical: "/docs/terms" },
  openGraph: {
    title: "서비스 이용 약관",
    description: "클코클라우드 플랫폼을 사용하는 모든 회원 및 개발자의 권리와 서비스 이용 수칙 명시.",
    images: ["/og-logo.jpg"]
  }
};

const headings = [
  { id: "notice", title: "기본 고지", level: 2 as const },
  { id: "buyer", title: "구매자 책임", level: 2 as const },
  { id: "refund", title: "청약철회 및 환불", level: 2 as const },
  { id: "legal", title: "책임 한계", level: 2 as const }
];

const clauses = [
  {
    title: "제1조 목적",
    body: "본 약관은 클코클라우드가 웹사이트를 통해 제공하는 Claude API Key 잔액형 디지털 상품의 구매 및 이용에 관한 사항을 규정합니다."
  },
  {
    title: "제2조 사업자 정보",
    body: "상호는 클코클라우드, 대표자는 김정후, 사업자등록번호는 656-01-03812입니다. 문의는 support.clcocloud@gmail.com 으로 접수합니다."
  },
  {
    title: "제3조 상품의 성격 및 비공식성",
    body: "본 상품은 Anthropic 공식 파트너, 공식 리셀러, 공식 대리점, 자회사, 관계사 또는 공식 제휴사가 제공하는 상품이 아닙니다. 구매자는 비공식 경로의 독립 디지털 상품임을 인지하고 구매합니다."
  },
  {
    title: "제4조 구매자의 확인 및 자기책임",
    body: "구매자는 상품이 디지털 상품이며 API Key 안내 후 청약철회가 제한될 수 있다는 점, 키 보관과 사용 책임이 본인에게 있다는 점, 사용량과 플랜 선택을 스스로 판단한다는 점에 동의합니다."
  },
  {
    title: "제5조 API Key 보관·관리 책임",
    body: "API Key의 보관, 공유 금지, 유출 방지, 폐기와 갱신 책임은 구매자에게 있습니다. 공개 저장소, 협업 도구, 로그, 클립보드, SNS 등에 노출되어 발생한 손해는 구매자가 부담합니다."
  },
  {
    title: "제6조 보안 및 데이터 책임",
    body: "구매자의 로컬 PC, 서버, 클라우드, IDE, CLI, 자동화 도구에서 발생하는 인증 정보 노출, 환경변수 유출, 로그 노출, 제3자 소프트웨어 이슈는 구매자의 사용 환경에서 발생한 사안입니다."
  },
  {
    title: "제7조 개인정보 및 사용자 데이터",
    body: "회사는 결제와 안내에 필요한 최소 정보만 처리합니다. API 호출 과정에서 입력되는 프롬프트, 코드, 문서, 이미지, 개인정보, 영업비밀 등 사용자 데이터 처리 책임은 구매자 및 해당 API 정책 범위에 따릅니다."
  },
  {
    title: "제8조 이용 제한",
    body: "API Key 재판매, 재배포, 공유, 양도, 임대, 스팸, 자동화 어뷰징, 불법 콘텐츠 생성, 시스템에 부당한 부하를 주는 행위는 금지됩니다."
  },
  {
    title: "제9조 회사의 면책 및 책임 한계",
    body: "Anthropic 측 정책 변경, 가격 변동, 서비스 중단, 계정 제재, 지역 차단, API Key 유출, 구매자의 약관 위반, 데이터 관련 분쟁 등 회사의 통제 범위를 벗어난 사유에 대해 회사는 책임지지 않습니다."
  },
  {
    title: "제10조 청약철회 및 환불",
    body: "본 상품은 디지털 콘텐츠 특성상 API Key 또는 사용 정보가 안내된 시점 이후 청약철회가 제한됩니다. 안내 전 회사 귀책으로 안내가 불가능한 경우에 한해 환불될 수 있습니다."
  }
];

export default function TermsPage() {
  return (
    <DocsArticle pathname="/docs/terms" headings={headings}>
      <h1>이용약관 및 정책</h1>
      <p className="lead">클코클라우드 이용약관 및 정책 요약입니다. 시행일자는 2026년 5월 19일입니다.</p>
      <h2 id="notice">기본 고지</h2>
      <p className="docs-legal-fineprint">클코클라우드는 Anthropic의 공식 파트너·리셀러·관계사가 아니며, 본 사이트에서 판매되는 상품은 비공식 경로의 독립 디지털 상품입니다.</p>
      <p className="docs-legal-fineprint">상호: 클코클라우드 · 대표자: 김정후 · 사업자등록번호: 656-01-03812 · 문의: support.clcocloud@gmail.com</p>
      <h2 id="buyer">구매자 책임</h2>
      <p className="docs-legal-fineprint">구매자는 API Key의 보관, 사용, 관리, 폐기, 갱신에 대한 책임을 부담합니다. 키 유출, 오남용, 제3자 공유, 공개 채널 노출로 인한 잔액 소진과 분쟁은 구매자 책임입니다.</p>
      <h2 id="refund">청약철회 및 환불</h2>
      <p className="docs-legal-fineprint">API Key 또는 사용 정보가 안내된 이후에는 디지털 콘텐츠 특성상 청약철회가 제한됩니다. 사용·차감된 금액과 결제 수수료는 환불 대상에서 제외될 수 있습니다.</p>
      <h2 id="legal">책임 한계</h2>
      <div className="docs-legal-clauses">
        {clauses.map((clause) => (
          <details key={clause.title}>
            <summary>{clause.title}</summary>
            <p>{clause.body}</p>
          </details>
        ))}
      </div>
    </DocsArticle>
  );
}
