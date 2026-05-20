# 클코클라우드 `/docs` 구현 리포트

## 1. 신규 생성 파일 트리

```text
app/(docs)/layout.tsx
app/(docs)/docs/page.tsx
app/(docs)/docs/quickstart/page.tsx
app/(docs)/docs/api-key/page.tsx
app/(docs)/docs/installation/page.tsx
app/(docs)/docs/installation/linux/page.tsx
app/(docs)/docs/installation/macos/page.tsx
app/(docs)/docs/installation/windows-powershell/page.tsx
app/(docs)/docs/installation/windows-cmd/page.tsx
app/(docs)/docs/agent-integration/page.tsx
app/(docs)/docs/environment-variables/page.tsx
app/(docs)/docs/troubleshooting/page.tsx
app/(docs)/docs/faq/page.tsx
app/(docs)/docs/pricing-plans/page.tsx
app/(docs)/docs/usage-monitoring/page.tsx
app/(docs)/docs/changelog/page.tsx
components/docs/Callout.tsx
components/docs/CodeBlock.tsx
components/docs/CopyCommand.tsx
components/docs/DocsArticle.tsx
components/docs/DocsBreadcrumb.tsx
components/docs/DocsFooter.tsx
components/docs/DocsHeader.tsx
components/docs/DocsSearch.tsx
components/docs/DocsSidebar.tsx
components/docs/DocsTOC.tsx
components/docs/FeedbackBar.tsx
components/docs/NextPrevNav.tsx
components/docs/OSTabs.tsx
lib/docs/navigation.ts
lib/docs/search-index.ts
lib/docs/snippets.ts
lib/docs/toc.ts
```

Updated existing file:

```text
app/sitemap.ts
```

## 2. `globals.css` 미변경 확인

```text
git diff -- app/globals.css app/page.tsx components/sequences components/navigation components/ui public
=> 0 lines
```

판매 페이지 `/` 코드, className, 자산은 수정하지 않았다.

## 3. 컴포넌트 props 표

| Component | Props |
| --- | --- |
| `CodeBlock` | `code:string`, `lang:string`, `filename?:string`, `highlightLines?:number[]`, `showLineNumbers?:boolean` |
| `OSTabs` | `tabs:Array<{ id:string; label:string; icon:string; code:string; lang:string; filename?:string }>` |
| `Callout` | `variant:"info" \| "tip" \| "warn" \| "danger"`, `title?:string`, `children:ReactNode` |
| `CopyCommand` | `command:string` |
| `DocsArticle` | `pathname:string`, `headings:Heading[]`, `children:ReactNode` |
| `DocsTOC` | `headings:Heading[]` |
| `DocsBreadcrumb` | `pathname:string` |
| `NextPrevNav` | `pathname:string` |
| `DocsSearch` | `compact?:boolean` |

## 4. `navigation.ts` 전체 코드

```ts
export type NavItem = {
  title: string;
  href: string;
};

export type NavGroup = {
  group: string;
  items: NavItem[];
};

export const NAV: NavGroup[] = [
  {
    group: "시작하기",
    items: [
      { title: "소개", href: "/docs" },
      { title: "5분 빠른 시작", href: "/docs/quickstart" },
      { title: "API 키 발급", href: "/docs/api-key" }
    ]
  },
  {
    group: "설치 & 설정",
    items: [
      { title: "설치 개요", href: "/docs/installation" },
      { title: "Linux", href: "/docs/installation/linux" },
      { title: "macOS", href: "/docs/installation/macos" },
      { title: "Windows PowerShell", href: "/docs/installation/windows-powershell" },
      { title: "Windows CMD", href: "/docs/installation/windows-cmd" },
      { title: "환경 변수 레퍼런스", href: "/docs/environment-variables" }
    ]
  },
  {
    group: "에이전트 연동",
    items: [
      { title: "외부 에이전트 연동", href: "/docs/agent-integration" },
      { title: "Claude Code", href: "/docs/agent-integration#claude-code" },
      { title: "Cursor", href: "/docs/agent-integration#cursor" },
      { title: "기타 IDE", href: "/docs/agent-integration#other" }
    ]
  },
  {
    group: "운영",
    items: [
      { title: "사용량 모니터링", href: "/docs/usage-monitoring" },
      { title: "요금제", href: "/docs/pricing-plans" },
      { title: "문제 해결", href: "/docs/troubleshooting" },
      { title: "FAQ", href: "/docs/faq" },
      { title: "변경 이력", href: "/docs/changelog" }
    ]
  }
];
```

## 5. OS 코드 스니펫 byte-diff

```text
LINUX_CODE: byte diff OK (350 bytes)
MACOS_CODE: byte diff OK (348 bytes)
PS_CODE: byte diff OK (431 bytes)
CMD_CODE: byte diff OK (293 bytes)
```

## 6. 외부 에이전트 명령어 검증

```text
AGENT_INSTALL_COMMAND: exact source string OK and shared by quickstart + agent-integration
```

검증 문자열:

```text
Install and configure anthropic model by following the instructions here: https://github.com/clcocloud/clcocloud.md
```

## 7. Lighthouse 결과

Lighthouse CLI가 로컬 시스템과 `node_modules`에 없다. 신규 라이브러리 설치 금지 조건 때문에 `npx lighthouse` 설치 실행은 하지 않았다.

대신 완료한 검증:

```text
npm run build      => pass
npm run typecheck  => pass
agent-browser page errors => none
agent-browser console     => clear/no runtime error observed
```

## 8. 반응형 스크린샷 가이드

생성된 검증 스크린샷:

```text
/private/tmp/clcocloud-docs-1440.png
/private/tmp/clcocloud-docs-1280-quickstart.png
/private/tmp/clcocloud-docs-1024-installation.png
/private/tmp/clcocloud-docs-768-agent.png
/private/tmp/clcocloud-docs-375-quickstart-final2.png
```

검증 뷰포트:

```text
1440 x 900: /docs
1280 x 900: /docs/quickstart
1024 x 900: /docs/installation
768 x 900: /docs/agent-integration
375 x 812: /docs/quickstart
```

## 9. 레퍼런스 DNA 반영 매핑

| Reference | 반영 위치 |
| --- | --- |
| Anthropic Docs | 3컬럼 레이아웃, 좌측 그룹형 사이드바, 중앙 문서 본문 |
| Stripe Docs | OS 탭 코드블록, callout, 문서 하단 feedback |
| Linear Docs | 미니멀 사이드바, breadcrumb, 조용한 문서 UI |
| Vercel Docs | sticky 우측 TOC, IntersectionObserver active indicator |
| Toss Tech | 한국어 본문 위계, 넓은 줄간격, 개발자용 한글 설명 구조 |
| 판매 페이지 토큰 | `--cream`, `--coral`, `--ink` 계열 토큰 상속 |

## 10. 판매 페이지 영향 0 검증 리포트

수정된 기존 파일은 `app/sitemap.ts`뿐이다. `/docs` URL을 sitemap에 추가했으며, 판매 페이지 `/`의 렌더링 코드와 자산은 변경하지 않았다.

```text
git status --short
 M app/sitemap.ts
?? app/(docs)/
?? components/docs/
?? lib/docs/
?? docs/clcocloud-docs-implementation-report.md
```
