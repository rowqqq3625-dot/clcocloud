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

export const metadata: Metadata = {
  metadataBase: new URL("https://clcocloud.kr"),
  title: "클코클라우드",
  description:
    "클코클라우드는 공식 클로드코드CLI를 위한 최고의 API키 잔액충전 플랫폼입니다. 6분의 1 가격으로 시작하세요.",
  openGraph: {
    title: "클코클라우드",
    description:
      "Claude Code 전용 잔액 충전형 API 키 서비스. 1회 충전, 잔액 만료 없음, 개인 전용 키.",
    images: ["/images/og-clcocloud.webp"]
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
