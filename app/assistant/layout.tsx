import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "클코클라우드 | AI 개발 어시스턴트",
  description: "클로드코드 설치, API 연동 등 개발 중에 막히는 모든 문제를 실시간으로 명쾌하게 물어보세요.",
  alternates: { canonical: "/assistant" },
  openGraph: {
    title: "클코클라우드 | AI 개발 어시스턴트",
    description: "클로드코드 설치, API 연동 등 개발 중에 막히는 모든 문제를 실시간으로 명쾌하게 물어보세요.",
    images: ["/og-logo.jpg"]
  }
};

export default function AssistantLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
