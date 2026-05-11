import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { LenisProvider } from "@/components/scroll/LenisProvider";

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
  "클로드코드, 아직도 정가 내고 쓰시나요? 공식 CLI 완벽 지원 + 정가 6분의1 가격으로 압도적인 가성비, 지금 바로 경험하세요. 국내 최대 API 잔액 충전 플랫폼 클코클라우드";

export const metadata: Metadata = {
  metadataBase: new URL("https://clcocloud.kr"),
  title: "클코클라우드 | 클로드코드 API 잔액 충전",
  description: siteDescription,
  keywords: ["클코클라우드", "클로드코드", "Claude Code", "API 잔액 충전", "클로드코드 CLI", "클로드코드 API"],
  openGraph: {
    title: "클코클라우드",
    description: siteDescription,
    images: ["/clcocloud-logo.png"]
  },
  icons: {
    icon: "/clcocloud-logo.png",
    shortcut: "/clcocloud-logo.png",
    apple: "/clcocloud-logo.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${pretendard.variable} ${inter.variable} ${mono.variable}`}>
      <body>
        <LenisProvider />
        {children}
      </body>
    </html>
  );
}
