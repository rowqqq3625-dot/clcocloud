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

const siteDescription =
  "가격 부담으로 망설여졌던 바이브코딩, 이제 멈추지않는 혁신을 만나보세요.";

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
  metadataBase: new URL("https://clcocloud.kr"),
  title: "클코클라우드 - 생각은 가볍게, 빌드는 완벽하게",
  description: siteDescription,
  keywords: ["클코클라우드", "클로드코드", "Claude Code", "API 잔액 충전", "클로드코드 CLI", "클로드코드 API"],
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/og-logo.jpg"
  },
  openGraph: {
    type: "website",
    siteName: "클코클라우드",
    title: "클코클라우드 - 생각은 가볍게, 빌드는 완벽하게",
    description: siteDescription,
    images: [
      {
        url: "/og-logo.jpg",
        width: 1024,
        height: 1024,
        alt: "클코클라우드 로고"
      }
    ]
  },
  twitter: {
    card: "summary",
    title: "클코클라우드 - 생각은 가볍게, 빌드는 완벽하게",
    description: siteDescription,
    images: ["/og-logo.jpg"]
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
        <div aria-hidden="true" className="sr-only" itemScope itemType="https://schema.org/WebPage">
          <h1 itemProp="name">클코클라우드 - 생각은 가볍게, 빌드는 완벽하게</h1>
          <p itemProp="description">가격 부담으로 망설여졌던 바이브코딩, 이제 멈추지않는 혁신을 만나보세요.</p>
        </div>
        <LenisProvider />
        {children}
        <BotLauncher />
      </body>
    </html>
  );
}
