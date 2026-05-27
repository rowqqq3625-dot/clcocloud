/**
 * JSON-LD for the home page.
 *
 * Goals:
 * - Force Google to pick our brand mark (og-logo.jpg) as the publisher
 *   logo by declaring it as an ImageObject with explicit width/height
 *   (Google's logo guidance: prefer 112×112+, ImageObject with caption).
 * - Tie Organization, WebSite, and WebPage together with @id references
 *   so search engines treat them as one entity, not three.
 * - Provide the canonical title + description text we want surfaced
 *   in SERPs, exactly matching the sr-only block in layout.tsx and the
 *   <title>/<meta description> the Next.js metadata API emits.
 *
 * Favicon is intentionally NOT referenced here — the browser-tab icon
 * (app/icon.png, character) lives in a separate channel via the
 * Next.js icons metadata. Search engine surfaces only see the brand
 * mark referenced below.
 */

const SITE_URL = "https://clcocloud.kr";
const SITE_TITLE = "클코클라우드 - 생각은 가볍게, 빌드는 완벽하게";
const SITE_DESCRIPTION =
  "클로드코드, 아직도 정가 내고 쓰시나요? 가격고민 ZERO 나만의 API KEY, 멈추지않는 혁신을 지금 경험하세요.";
const BRAND_LOGO_URL = `${SITE_URL}/og-logo.jpg`;
const BRAND_LOGO_WIDTH = 1024;
const BRAND_LOGO_HEIGHT = 1024;
const BRAND_LOGO_CAPTION = "클코클라우드 로고";

const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const WEBPAGE_ID = `${SITE_URL}/#webpage`;
const LOGO_ID = `${SITE_URL}/#logo`;
const PRIMARY_IMAGE_ID = `${SITE_URL}/#primaryimage`;

const logoImageObject = {
  "@type": "ImageObject",
  "@id": LOGO_ID,
  inLanguage: "ko-KR",
  url: BRAND_LOGO_URL,
  contentUrl: BRAND_LOGO_URL,
  width: BRAND_LOGO_WIDTH,
  height: BRAND_LOGO_HEIGHT,
  caption: BRAND_LOGO_CAPTION
};

const primaryImageObject = {
  "@type": "ImageObject",
  "@id": PRIMARY_IMAGE_ID,
  inLanguage: "ko-KR",
  url: BRAND_LOGO_URL,
  contentUrl: BRAND_LOGO_URL,
  width: BRAND_LOGO_WIDTH,
  height: BRAND_LOGO_HEIGHT,
  caption: BRAND_LOGO_CAPTION
};

const organization = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: "클코클라우드",
  alternateName: ["clcocloud", "클로드코드 API 충전", "Claude Code API 충전"],
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  logo: logoImageObject,
  image: { "@id": LOGO_ID },
  sameAs: [SITE_URL]
};

const website = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: SITE_URL,
  name: SITE_TITLE,
  alternateName: [
    "클코클라우드",
    "클로드코드 API 잔액 충전",
    "Claude Code API 충전"
  ],
  description: SITE_DESCRIPTION,
  inLanguage: "ko-KR",
  publisher: { "@id": ORG_ID }
};

const webPage = {
  "@type": "WebPage",
  "@id": WEBPAGE_ID,
  url: SITE_URL,
  name: SITE_TITLE,
  description: SITE_DESCRIPTION,
  isPartOf: { "@id": WEBSITE_ID },
  about: { "@id": ORG_ID },
  primaryImageOfPage: { "@id": PRIMARY_IMAGE_ID },
  inLanguage: "ko-KR",
  publisher: { "@id": ORG_ID }
};

const itemList = {
  "@type": "ItemList",
  name: "클코클라우드 핵심 링크",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      url: `${SITE_URL}/#pricing`,
      name: "공식 클로드코드 API 키 충전",
      description: "공식 CLI 완벽 지원. 정가 부담 없이 바로 시작."
    },
    {
      "@type": "ListItem",
      position: 2,
      url: `${SITE_URL}/#dashboard-preview`,
      name: "실시간 토큰 사용량 대시보드",
      description: "잔액, 사용량, 요청 기록을 한눈에 확인."
    },
    {
      "@type": "ListItem",
      position: 3,
      url: `${SITE_URL}/#pricing`,
      name: "AI 번들 결합 패키지",
      description: "고성능 모델까지 API 키 하나로 더 오래 사용."
    },
    {
      "@type": "ListItem",
      position: 4,
      url: `${SITE_URL}/#flow`,
      name: "CLI 연동 및 퀵스타트 가이드",
      description: "결제 후 API 키 발급. 클로드코드에 바로 연결."
    }
  ]
};

const graph = {
  "@context": "https://schema.org",
  "@graph": [
    organization,
    primaryImageObject,
    website,
    webPage,
    itemList
  ]
};

export function HomeStructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
