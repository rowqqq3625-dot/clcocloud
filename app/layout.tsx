import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { LenisProvider } from "@/components/scroll/LenisProvider";
import { BotLauncher } from "@/components/bot/BotLauncher";

const pretendard = localFont({
  src: "../public/fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  fallback: ["system-ui", "sans-serif"]
});

const inter = localFont({
  src: "../public/fonts/PretendardVariable.woff2",
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "sans-serif"]
});

const mono = localFont({
  src: "../public/fonts/PretendardVariable.woff2",
  variable: "--font-mono",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "monospace"]
});

// Single source of truth for search-engine surfaces. The visible page
// never shows these strings; they only ship via <title>, meta description,
// OG/Twitter tags, JSON-LD, and the aria-hidden sr-only block below.
const SITE_URL = "https://clcocloud.kr";
const SITE_TITLE = "클코클라우드 - 생각은 가볍게, 빌드는 완벽하게";
const SITE_DESCRIPTION =
  "클로드코드, 아직도 정가 내고 쓰시나요?\n가격고민 ZERO 나만의 API KEY, 멈추지않는 혁신을 지금 경험하세요.";
const SITE_DESCRIPTION_FLAT = SITE_DESCRIPTION.replace(/\s*\n\s*/g, " ");
// Brand logo (C + Cloud mark on cream). Used as the search-engine
// publisher logo, OG card image, and Twitter card image. The favicon
// in the browser tab is a SEPARATE asset (app/icon.png — character),
// intentionally kept distinct from the brand mark shown in search.
const BRAND_LOGO_PATH = "/og-logo.jpg";
const BRAND_LOGO_URL = `${SITE_URL}${BRAND_LOGO_PATH}`;
const BRAND_LOGO_WIDTH = 1024;
const BRAND_LOGO_HEIGHT = 1024;
const BRAND_LOGO_ALT = "클코클라우드 로고";

const chunkReloadGuard = `
(() => {
  const KEY = "clco:chunk-reload-at";
  const isChunkFailure = (value) => {
    const text = String(value?.message || value?.reason?.message || value?.error?.message || value || "");
    const request = String(value?.request || value?.reason?.request || "");
    return text.includes("ChunkLoadError") || text.includes("Loading chunk") || request.includes("/_next/static/chunks/");
  };
  const reloadOnce = (event) => {
    if (!isChunkFailure(event)) return;
    const now = Date.now();
    const last = Number(sessionStorage.getItem(KEY) || 0);
    if (now - last < 10000) return;
    sessionStorage.setItem(KEY, String(now));
    location.reload();
  };
  addEventListener("error", reloadOnce);
  addEventListener("unhandledrejection", reloadOnce);
  addEventListener("load", () => setTimeout(() => sessionStorage.removeItem(KEY), 30000), { once: true });
})();
`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | 클코클라우드"
  },
  description: SITE_DESCRIPTION_FLAT,
  applicationName: "클코클라우드",
  generator: "Next.js",
  // Keywords are largely ignored by Google but Naver and Daum still
  // weigh them. Front-load brand + intent terms.
  keywords: [
    "클코클라우드",
    "클로드코드",
    "Claude Code",
    "클로드코드 API",
    "Claude API",
    "API 키 충전",
    "API 잔액 충전",
    "클로드코드 CLI",
    "Anthropic API",
    "Claude Code 한국",
    "Claude Code 정가 대안",
    "AI 코딩 도우미",
    "구독 없는 클로드코드",
    "나만의 API KEY"
  ],
  authors: [{ name: "클코클라우드", url: SITE_URL }],
  creator: "클코클라우드",
  publisher: "클코클라우드",
  category: "developer-tools",
  formatDetection: { email: false, address: false, telephone: false },
  alternates: {
    canonical: "/",
    languages: { "ko-KR": "/" }
  },
  // Maximize indexability while still respecting <main data-nosnippet>
  // on the home page. The hidden sr-only block (below) supplies the
  // exact title/description we want crawlers to surface.
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  // Browser-tab favicon stays as the character. The brand mark is only
  // referenced via OpenGraph/Twitter/Schema for search surfaces. We keep
  // apple-touch-icon as the character too so iOS home-screen bookmarks
  // match the favicon visual identity — the SEO logo channel is OG/Schema.
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    shortcut: ["/icon.png"],
    apple: [{ url: "/icon.png", type: "image/png" }]
  },
  openGraph: {
    type: "website",
    siteName: "클코클라우드",
    locale: "ko_KR",
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION_FLAT,
    images: [
      {
        url: BRAND_LOGO_PATH,
        secureUrl: BRAND_LOGO_URL,
        width: BRAND_LOGO_WIDTH,
        height: BRAND_LOGO_HEIGHT,
        alt: BRAND_LOGO_ALT,
        type: "image/jpeg"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    site: "@clcocloud",
    creator: "@clcocloud",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION_FLAT,
    images: [
      {
        url: BRAND_LOGO_PATH,
        alt: BRAND_LOGO_ALT,
        width: BRAND_LOGO_WIDTH,
        height: BRAND_LOGO_HEIGHT
      }
    ]
  },
  other: {
    // Naver/Daum honor these in addition to og:*; redundancy is cheap
    // and helps Korean search engines pick the right card image.
    "og:image:secure_url": BRAND_LOGO_URL,
    "og:image:width": String(BRAND_LOGO_WIDTH),
    "og:image:height": String(BRAND_LOGO_HEIGHT),
    "og:image:alt": BRAND_LOGO_ALT,
    "og:image:type": "image/jpeg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${pretendard.variable} ${inter.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: chunkReloadGuard }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@1,6..72,400..700&family=Song+Myung&family=Nanum+Myeongjo:wght@700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        {/*
          Search-engine-only block. Visually hidden via `sr-only` and
          hidden from screen readers via `aria-hidden="true"`, but fully
          present in the SSR HTML so Googlebot / Naverbot / Bingbot index
          the canonical title, description, and brand logo we want them
          to surface. The microdata WebPage + ImageObject pairs with the
          JSON-LD in HomeStructuredData so search engines have two
          independent signals confirming the same publisher logo.
        */}
        <div
          aria-hidden="true"
          className="sr-only"
          itemScope
          itemType="https://schema.org/WebPage"
        >
          <meta itemProp="inLanguage" content="ko-KR" />
          <link itemProp="url" href={SITE_URL} />
          <h1 itemProp="name headline">{SITE_TITLE}</h1>
          <p itemProp="description">{SITE_DESCRIPTION_FLAT}</p>
          <div itemProp="primaryImageOfPage" itemScope itemType="https://schema.org/ImageObject">
            <link itemProp="url contentUrl" href={BRAND_LOGO_URL} />
            <meta itemProp="width" content={String(BRAND_LOGO_WIDTH)} />
            <meta itemProp="height" content={String(BRAND_LOGO_HEIGHT)} />
            <meta itemProp="caption" content={BRAND_LOGO_ALT} />
          </div>
          <div itemProp="publisher" itemScope itemType="https://schema.org/Organization">
            <meta itemProp="name" content="클코클라우드" />
            <link itemProp="url" href={SITE_URL} />
            <div itemProp="logo" itemScope itemType="https://schema.org/ImageObject">
              <link itemProp="url contentUrl" href={BRAND_LOGO_URL} />
              <meta itemProp="width" content={String(BRAND_LOGO_WIDTH)} />
              <meta itemProp="height" content={String(BRAND_LOGO_HEIGHT)} />
              <meta itemProp="caption" content={BRAND_LOGO_ALT} />
            </div>
          </div>
        </div>
        <LenisProvider />
        {children}
        <BotLauncher />
      </body>
    </html>
  );
}
