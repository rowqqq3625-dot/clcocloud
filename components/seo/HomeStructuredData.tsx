const siteUrl = "https://clcocloud.kr";

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "클코클라우드",
    url: siteUrl,
    logo: `${siteUrl}/og-logo.jpg`,
    description: "가격 부담으로 망설여졌던 바이브코딩, 이제 멈추지않는 혁신을 만나보세요."
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "클코클라우드",
    alternateName: ["클로드코드 API 잔액 충전", "Claude Code API 충전"],
    url: siteUrl,
    description: "가격 부담으로 망설여졌던 바이브코딩, 이제 멈추지않는 혁신을 만나보세요."
  },
  {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "클코클라우드 핵심 링크",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        url: `${siteUrl}/#pricing`,
        name: "클로드코드 6분의1 가격",
        description: "공식 CLI 완벽 지원. 정가 부담 없이 바로 시작."
      },
      {
        "@type": "ListItem",
        position: 2,
        url: `${siteUrl}/#pricing`,
        name: "오푸스4.7 1M 사용 가능",
        description: "고성능 모델까지 API 키 하나로 더 오래 사용."
      },
      {
        "@type": "ListItem",
        position: 3,
        url: `${siteUrl}/#dashboard-preview`,
        name: "잔액 대시보드",
        description: "잔액, 사용량, 요청 기록을 한눈에 확인."
      },
      {
        "@type": "ListItem",
        position: 4,
        url: `${siteUrl}/#flow`,
        name: "공식 CLI 연결",
        description: "결제 후 API 키 발급. 클로드코드에 바로 연결."
      }
    ]
  }
];

export function HomeStructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
