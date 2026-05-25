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
  "가격 부담으로 망설였던 바이브코딩, 멈추지않는 혁신을 지금 만나보세요.";

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
  title: "생각은 가볍게, 빌드는 완벽하게 - 클코클라우드",
  description: siteDescription,
  keywords: ["클코클라우드", "클로드코드", "Claude Code", "API 잔액 충전", "클로드코드 CLI", "클로드코드 API"],
  openGraph: {
    title: "생각은 가볍게, 빌드는 완벽하게 - 클코클라우드",
    description: siteDescription,
    images: ["/clcocloud-logo.png"]
  },
  twitter: {
    card: "summary_large_image",
    title: "생각은 가볍게, 빌드는 완벽하게 - 클코클라우드",
    description: siteDescription,
    images: ["/clcocloud-logo.png"]
  },
  icons: {
    icon: "/search-logo.png",
    shortcut: "/search-logo.png",
    apple: "/search-logo.png"
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
        <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@1,6..72,400..700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <LenisProvider />
        {children}
        <BotLauncher />
      </body>
    </html>
  );
}
