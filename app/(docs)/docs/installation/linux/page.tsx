import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocsArticle } from "@/components/docs/DocsArticle";
import { LINUX_CODE } from "@/lib/docs/snippets";

export const metadata: Metadata = {
  title: "Linux CLI 설치 방법",
  description: "리눅스 환경에서 모듈 누락이나 터미널 권한 오류 없이 안정적으로 셋업하는 커맨드.",
  alternates: { canonical: "/docs/installation/linux" },
  openGraph: {
    title: "Linux CLI 설치 방법",
    description: "리눅스 환경에서 모듈 누락이나 터미널 권한 오류 없이 안정적으로 셋업하는 커맨드.",
    images: ["/og-logo.jpg"]
  }
};
const headings = [{ id: "linux", title: "Linux", level: 2 as const }];

export default function LinuxPage() {
  return (
    <DocsArticle pathname="/docs/installation/linux" headings={headings}>
      <h1>Linux</h1>
      <p className="lead">bash 환경에서 클코클라우드 엔드포인트와 인증 토큰을 설정합니다.</p>
      <h2 id="linux">Linux</h2>
      <CodeBlock code={LINUX_CODE} lang="bash" filename="~/.bashrc" highlightLines={[2, 3]} showLineNumbers />
    </DocsArticle>
  );
}
