import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DocsFooter } from "@/components/docs/DocsFooter";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsSidebar } from "@/components/docs/DocsSidebar";

export const metadata: Metadata = {
  title: {
    default: "클코클라우드 문서",
    template: "%s | 클코클라우드 문서"
  },
  description: "클로드 코드를 공식보다 합리적으로, 안정적으로 쓰기 위한 클코클라우드 개발자 문서입니다.",
  alternates: {
    canonical: "/docs"
  },
  openGraph: {
    title: "클코클라우드 문서",
    description: "클코클라우드 설치, API 키, 환경 변수, 외부 에이전트 연동 가이드",
    images: ["/clcocloud-logo.png"]
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div data-docs>
      <DocsHeader />
      <div className="docs-shell">
        <aside className="docs-sidebar-slot">
          <DocsSidebar />
        </aside>
        <main className="docs-content-shell">{children}</main>
      </div>
      <DocsFooter />
      <style
        dangerouslySetInnerHTML={{
          __html: `
          [data-docs] {
            --docs-bg: var(--cream);
            --docs-surface: #FFFCF6;
            --docs-text: var(--ink);
            --docs-text-soft: var(--ink-soft);
            --docs-text-faint: var(--ink-faint);
            --docs-line: var(--line);
            --docs-accent: var(--coral);
            --docs-code-bg: var(--surface-dark-2);
            --docs-code-text: rgba(247,241,232,0.88);
            --docs-code-line: rgba(247,241,232,0.06);
            --docs-sidebar-w: 280px;
            --docs-toc-w: 240px;
            --docs-content-w: minmax(0, 760px);
            --docs-header-h: 56px;
            min-height: 100vh;
            background: var(--docs-bg);
            color: var(--docs-text);
            font-family: var(--font-pretendard), system-ui, sans-serif;
            overflow: visible;
            overscroll-behavior-y: auto;
            touch-action: pan-y;
          }
          html:has([data-docs]), body:has([data-docs]) { overflow-y: auto !important; overscroll-behavior-y: auto; touch-action: pan-y; }
          [data-docs][data-theme="dark"] {
            --docs-bg: var(--surface-dark);
            --docs-surface: var(--surface-dark-2);
            --docs-text: var(--cream);
            --docs-text-soft: rgba(247,241,232,0.72);
            --docs-text-faint: rgba(247,241,232,0.45);
            --docs-line: var(--line-dark);
          }
          [data-docs] * { box-sizing: border-box; }
          [data-docs] code, [data-docs] pre, [data-docs] kbd { font-family: var(--font-mono), "JetBrains Mono", ui-monospace, SFMono-Regular, monospace; }
          .docs-header {
            position: sticky; top: 0; z-index: 50; height: var(--docs-header-h);
            background: rgba(247,241,232,0.85); backdrop-filter: blur(14px);
            border-bottom: 1px solid var(--docs-line);
          }
          .docs-header-inner {
            height: 100%; display: grid; grid-template-columns: 280px minmax(220px, 320px) 1fr;
            align-items: center; gap: 24px; padding: 0 32px;
          }
          .docs-brand { display: flex; align-items: center; gap: 9px; font-weight: 700; color: var(--docs-text); }
          .docs-brand em {
            margin-left: 2px; padding: 2px 8px; border-radius: 6px; background: rgba(217,119,87,0.10);
            color: var(--coral); font-size: var(--fs-caption); font-style: normal; font-weight: 600;
          }
          .docs-menu-button { display: none; width: 36px; height: 36px; border: 1px solid var(--docs-line); border-radius: var(--r-sm); background: var(--docs-surface); color: var(--docs-text); }
          .docs-header-actions { justify-self: end; display: flex; align-items: center; gap: 10px; font-size: 14px; }
          .docs-header-actions a { display: inline-flex; align-items: center; gap: 7px; height: 36px; padding: 0 12px; border-radius: var(--r-sm); color: var(--docs-text-soft); }
          .docs-dashboard-link { border: 1px solid rgba(217,119,87,0.36); color: var(--coral) !important; }
          .docs-search-trigger {
            width: 100%; height: 36px; display: flex; align-items: center; gap: 10px; padding: 0 12px;
            background: var(--docs-surface); border: 1px solid var(--docs-line); border-radius: var(--r-md);
            color: var(--docs-text-faint); font-size: 14px; text-align: left; cursor: pointer;
          }
          .docs-search-trigger kbd { margin-left: auto; border: 1px solid var(--docs-line); border-radius: 6px; padding: 2px 6px; font-size: var(--fs-caption); color: var(--docs-text-soft); background: rgba(255,255,255,0.28); }
          .docs-mobile-search { display: none; }
          body.docs-search-open { overflow: hidden !important; overscroll-behavior: contain; }
          .docs-search-overlay {
            --docs-bg: var(--cream);
            --docs-surface: #FFFCF6;
            --docs-text: var(--ink);
            --docs-text-soft: var(--ink-soft);
            --docs-text-faint: var(--ink-faint);
            --docs-line: var(--line);
            position: fixed; inset: 0; z-index: 2147483000; isolation: isolate; display: grid; align-items: start; justify-items: center; background: rgba(31,30,29,0.58); backdrop-filter: blur(14px) saturate(0.92); -webkit-backdrop-filter: blur(14px) saturate(0.92); padding: max(80px, env(safe-area-inset-top)) 20px max(24px, env(safe-area-inset-bottom)); overflow-y: auto; overscroll-behavior: contain;
          }
          .docs-search-modal { position: relative; z-index: 1; contain: paint; width: min(640px, calc(100vw - 40px)); max-height: min(720px, calc(100dvh - 120px)); margin: 0 auto; background: #FFFCF6; color: var(--ink); border: 1px solid var(--line); border-radius: var(--r-lg); box-shadow: 0 32px 120px rgba(31,30,29,.36); overflow: hidden; }
          .docs-search-input-row { height: 56px; display: flex; align-items: center; gap: 12px; padding: 0 20px; border-bottom: 1px solid var(--docs-line); }
          .docs-search-input-row input { flex: 1; border: 0; outline: 0; background: transparent; color: var(--docs-text); font-size: var(--fs-body-lg); }
          .docs-search-input-row button { border: 0; background: transparent; color: var(--docs-text-soft); cursor: pointer; }
          .docs-search-results { max-height: calc(min(720px, 100dvh - 120px) - 56px); overflow-y: auto; background: var(--docs-surface); scrollbar-width: thin; scrollbar-color: rgba(217,119,87,.62) rgba(31,30,29,.06); }
          .docs-search-results::-webkit-scrollbar { width: 10px; }
          .docs-search-results::-webkit-scrollbar-track { background: rgba(31,30,29,.06); border-radius: 999px; }
          .docs-search-results::-webkit-scrollbar-thumb { background: linear-gradient(180deg, rgba(217,119,87,.48), rgba(217,119,87,.82)); border: 2px solid var(--docs-surface); border-radius: 999px; }
          .docs-search-results::-webkit-scrollbar-thumb:hover { background: rgba(217,119,87,.88); }
          .docs-search-results a { display: grid; grid-template-columns: 1fr auto; gap: 18px; padding: 12px 20px; color: var(--docs-text); }
          .docs-search-results a:hover, .docs-search-results a.is-active { background: rgba(217,119,87,0.14); }
          .docs-search-results strong { display: block; font-size: var(--fs-body); }
          .docs-search-results small, .docs-search-results em { color: var(--docs-text-soft); font-size: var(--fs-caption); font-style: normal; }
          .docs-shell { display: grid; grid-template-columns: var(--docs-sidebar-w) minmax(0, 1fr); overflow: visible; }
          .docs-sidebar-slot { border-right: 1px solid var(--docs-line); }
          .docs-sidebar {
            position: sticky; top: var(--docs-header-h); width: var(--docs-sidebar-w); height: calc(100vh - var(--docs-header-h));
            overflow-y: auto; padding: 32px 24px 32px 32px; background: var(--docs-bg); scrollbar-width: thin;
          }
          .docs-sidebar::-webkit-scrollbar { width: 8px; }
          .docs-sidebar::-webkit-scrollbar-thumb { background: rgba(31,30,29,0.15); border-radius: 999px; }
          .docs-sidebar-group-trigger { width: 100%; margin: 24px 0 8px; padding: 0; display: flex; align-items: center; justify-content: space-between; border: 0; background: transparent; color: var(--docs-text-faint); font-size: var(--fs-eyebrow); letter-spacing: 0.12em; text-transform: uppercase; font-weight: 600; cursor: pointer; }
          .docs-sidebar-group-trigger svg { transition: transform 180ms var(--ease-out); }
          .docs-sidebar-group-trigger[aria-expanded="true"] svg { transform: rotate(180deg); }
          .docs-sidebar ul { list-style: none; margin: 0; padding: 0; }
          .docs-sidebar li.is-nested { padding-left: 16px; }
          .docs-sidebar a {
            position: relative; display: block; padding: 6px 12px; border-radius: var(--r-sm); color: var(--docs-text-soft);
            font-size: 14px; line-height: 1.55; transition: color 180ms var(--ease-out), background 180ms var(--ease-out);
          }
          .docs-sidebar li.is-nested a { font-size: 13px; padding-left: 12px; }
          .docs-sidebar a:hover { background: rgba(217,119,87,0.08); color: var(--ink); }
          .docs-sidebar a.is-active { background: rgba(217,119,87,0.12); color: var(--coral); font-weight: 600; }
          .docs-sidebar-indicator { position: absolute; left: -16px; top: 50%; width: 2px; height: 16px; transform: translateY(-50%); border-radius: 999px; background: var(--coral); }
          .docs-content-shell { display: grid; grid-template-columns: minmax(0, 760px) var(--docs-toc-w); justify-content: center; gap: 56px; padding: 0 40px; overflow: visible; }
          .docs-article { width: 100%; max-width: 760px; padding: 48px 0 96px; }
          .docs-article h1 { margin: 0; color: var(--docs-text); font-size: var(--fs-h1); line-height: var(--lh-h); letter-spacing: -0.025em; font-weight: 700; word-break: keep-all; overflow-wrap: anywhere; }
          .docs-article h2 { margin: 64px 0 16px; padding-top: 40px; border-top: 1px solid var(--docs-line); color: var(--docs-text); font-size: var(--fs-h2); line-height: var(--lh-h); letter-spacing: var(--tracking-h); font-weight: 700; word-break: keep-all; overflow-wrap: anywhere; }
          .docs-article h3 { margin: 40px 0 12px; color: var(--docs-text); font-size: var(--fs-h3); line-height: var(--lh-h); font-weight: 600; word-break: keep-all; overflow-wrap: anywhere; }
          .docs-article h4 { margin: 28px 0 10px; color: var(--docs-text); font-size: 18px; font-weight: 600; }
          .docs-article p, .docs-article li { color: var(--docs-text-soft); font-size: var(--fs-body); line-height: 1.75; word-break: keep-all; overflow-wrap: anywhere; }
          .docs-article .lead { margin: 16px 0 32px; color: var(--docs-text-soft); font-size: var(--fs-body-lg); line-height: 1.75; }
          .docs-article ul, .docs-article ol { padding-left: 22px; }
          .docs-article a { color: var(--coral-deep); font-weight: 600; }
          .docs-article :not(pre) > code {
            padding: 2px 6px; border-radius: 4px; background: rgba(217,119,87,0.08); color: var(--coral-deep);
            font-size: 13px; word-break: break-all;
          }
          .docs-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 16px; color: var(--docs-text-faint); font-size: var(--fs-caption); }
          .docs-breadcrumb a:hover { color: var(--coral); }
          .docs-toc { position: sticky; top: 88px; width: var(--docs-toc-w); max-height: calc(100vh - 120px); overflow-y: auto; padding-top: 48px; }
          .docs-toc h2 { margin: 0 0 12px; color: var(--docs-text-faint); font-size: var(--fs-eyebrow); letter-spacing: 0.12em; text-transform: uppercase; font-weight: 600; }
          .docs-toc a { display: block; border-left: 2px solid transparent; margin-left: -2px; padding: 4px 0 4px 12px; color: var(--docs-text-soft); font-size: var(--fs-caption); line-height: 1.5; transition: color 180ms var(--ease-out), border 180ms var(--ease-out); }
          .docs-toc a.is-h3 { padding-left: 24px; }
          .docs-toc a.is-active { color: var(--coral); border-left-color: var(--coral); font-weight: 600; }
          .docs-card-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 32px; }
          .docs-card { border: 1px solid var(--docs-line); border-radius: var(--r-lg); padding: 24px; background: var(--docs-surface); transition: transform 220ms var(--ease-out), border 180ms var(--ease-out), box-shadow 220ms var(--ease-out); }
          .docs-card:hover { transform: translateY(-4px); border-color: var(--coral); box-shadow: var(--shadow-sm); }
          .docs-card svg { color: var(--coral); margin-bottom: 18px; }
          .docs-card strong { display: block; color: var(--docs-text); font-size: 18px; margin-bottom: 8px; }
          .docs-card span { color: var(--docs-text-soft); font-size: 14px; line-height: 1.65; }
          .docs-code-block { position: relative; overflow: hidden; margin: 24px 0; border: 1px solid rgba(247,241,232,0.10); border-radius: var(--r-md); background: linear-gradient(180deg, rgba(247,241,232,0.04), transparent 42px), var(--docs-code-bg); box-shadow: 0 24px 80px rgba(31,30,29,.26), inset 0 1px rgba(247,241,232,.08); }
          .docs-code-block:before { content: ""; position: absolute; inset: 0; pointer-events: none; border-radius: inherit; box-shadow: inset 0 0 0 1px rgba(217,119,87,.10); }
          .docs-code-topbar { height: 40px; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 0 12px 0 16px; border-bottom: 1px solid var(--docs-code-line); background: rgba(247,241,232,0.055); }
          .docs-code-file, .docs-code-actions { display: flex; align-items: center; gap: 10px; min-width: 0; }
          .docs-code-file span:last-child { color: rgba(247,241,232,0.65); font-size: var(--fs-caption); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .docs-code-dots { display: flex; gap: 6px; }
          .docs-code-dots i { width: 6px; height: 6px; border-radius: 999px; background: rgba(247,241,232,0.20); }
          .docs-code-lang { padding: 2px 8px; border-radius: 4px; background: rgba(247,241,232,0.06); color: rgba(247,241,232,0.45); font-size: var(--fs-caption); letter-spacing: 0.08em; text-transform: uppercase; }
          .docs-copy-button { position: relative; width: 32px; height: 32px; display: inline-grid; place-items: center; border: 1px solid rgba(247,241,232,0.10); border-radius: var(--r-sm); background: transparent; color: rgba(247,241,232,0.65); opacity: 0.6; transition: opacity 180ms var(--ease-out), color 180ms var(--ease-out), border 180ms var(--ease-out), background 180ms var(--ease-out); }
          .docs-code-block:hover .docs-copy-button, .docs-copy-button:focus-visible { opacity: 1; }
          .docs-copy-button:hover { background: rgba(217,119,87,0.14); color: var(--coral); border-color: rgba(217,119,87,0.30); }
          .docs-copy-tooltip { position: absolute; right: 0; top: -30px; padding: 4px 8px; border-radius: 6px; background: rgba(247,241,232,0.92); color: var(--ink); font-size: var(--fs-caption); white-space: nowrap; }
          .docs-code-block pre { margin: 0; padding: 16px 0 18px; overflow-x: auto; color: var(--docs-code-text); font-size: 13px; line-height: 1.7; scrollbar-width: thin; scrollbar-color: rgba(217,119,87,.55) rgba(247,241,232,.06); }
          .docs-code-block pre::-webkit-scrollbar { height: 10px; }
          .docs-code-block pre::-webkit-scrollbar-track { background: rgba(247,241,232,.055); border-radius: 999px; }
          .docs-code-block pre::-webkit-scrollbar-thumb { background: linear-gradient(90deg, rgba(217,119,87,.45), rgba(217,119,87,.78)); border: 2px solid var(--docs-code-bg); border-radius: 999px; }
          .docs-code-block pre::-webkit-scrollbar-thumb:hover { background: rgba(217,119,87,.86); }
          .docs-code-line { position: relative; display: block; min-width: max-content; padding: 0 20px; }
          .docs-code-line.is-highlighted { background: rgba(217,119,87,0.12); }
          .docs-code-line.is-highlighted:before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: var(--coral); }
          .docs-line-number { display: inline-block; width: 2ch; margin-right: 16px; color: rgba(247,241,232,0.30); text-align: right; user-select: none; }
          .docs-token-keyword { color: var(--coral-soft); }
          .docs-token-string { color: #B8C9A8; }
          .docs-token-variable, .docs-token-env { color: var(--coral); font-weight: 600; }
          .docs-token-comment { color: rgba(247,241,232,0.40); }
          .docs-copy-command { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 16px 0; padding: 12px 16px; border: 1px solid rgba(247,241,232,0.08); border-radius: var(--r-sm); background: var(--surface-dark-2); color: rgba(247,241,232,0.88); }
          .docs-copy-command code { font-size: var(--fs-caption); overflow-x: auto; }
          .docs-copy-command button { border: 0; background: transparent; color: rgba(247,241,232,0.75); cursor: pointer; }
          .docs-copy-command button:hover { color: var(--coral); }
          .docs-action-card { display: grid; grid-template-columns: 24px 1fr auto; align-items: center; gap: 14px; margin: 18px 0 28px; padding: 18px 20px; border: 1px solid var(--docs-line); border-radius: var(--r-md); background: var(--docs-surface); color: var(--docs-text); transition: transform 220ms var(--ease-out), border 180ms var(--ease-out), box-shadow 220ms var(--ease-out); }
          .docs-action-card:hover { transform: translateY(-2px); border-color: var(--coral); box-shadow: var(--shadow-sm); }
          .docs-action-card svg { color: var(--coral); }
          .docs-action-card strong { display: block; color: var(--docs-text); font-size: var(--fs-body); }
          .docs-action-card small { display: block; margin-top: 3px; color: var(--docs-text-soft); font-size: var(--fs-caption); line-height: 1.5; }
          .docs-action-card-primary { background: linear-gradient(135deg, rgba(217,119,87,.12), rgba(255,252,246,.94)); border-color: rgba(217,119,87,.24); }
          .docs-os-tabs { margin: 24px 0; }
          .docs-os-tablist { min-height: 40px; display: flex; gap: 4px; padding: 4px; overflow-x: auto; border: 1px solid var(--docs-line); border-radius: var(--r-md); background: var(--docs-surface); }
          .docs-os-tablist button { flex: 0 0 auto; display: flex; align-items: center; gap: 8px; height: 32px; padding: 0 16px; border: 0; border-radius: var(--r-sm); background: transparent; color: var(--docs-text-soft); font-size: 14px; font-weight: 500; cursor: pointer; transition: color 180ms var(--ease-out), background 180ms var(--ease-out), box-shadow 180ms var(--ease-out); }
          .docs-os-tablist button:hover { color: var(--ink); background: rgba(217,119,87,0.06); }
          .docs-os-tablist button.is-active { color: var(--coral); background: rgba(217,119,87,0.12); box-shadow: inset 0 -2px 0 var(--coral); font-weight: 600; }
          .docs-callout { display: grid; grid-template-columns: 24px 1fr; gap: 12px; align-items: start; margin: 24px 0; padding: 16px 20px; border-radius: var(--r-md); color: var(--docs-text-soft); font-size: var(--fs-body); line-height: 1.7; }
          .docs-callout strong { display: block; margin-bottom: 4px; color: var(--ink); font-weight: 600; }
          .docs-callout-info { background: rgba(31,30,29,0.04); border: 1px solid var(--docs-line); border-left: 3px solid var(--ink-soft); }
          .docs-callout-tip { background: rgba(217,119,87,0.06); border: 1px solid rgba(217,119,87,0.18); border-left: 3px solid var(--coral); }
          .docs-callout-warn { background: #FEF6E7; border: 1px solid #F0D8A0; border-left: 3px solid #C99A2E; }
          .docs-callout-danger { background: #FDECEC; border: 1px solid #F0B8B8; border-left: 3px solid #C94646; }
          .docs-callout-info svg { color: var(--ink-soft); }
          .docs-callout-tip svg { color: var(--coral); }
          .docs-callout-warn svg { color: #C99A2E; }
          .docs-callout-danger svg { color: #C94646; }
          .docs-feedback { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-top: 64px; padding: 32px 0; border-top: 1px solid var(--docs-line); color: var(--docs-text-soft); font-size: var(--fs-body); }
          .docs-feedback div { display: flex; align-items: center; gap: 10px; }
          .docs-feedback button { width: 36px; height: 36px; display: inline-grid; place-items: center; border: 1px solid var(--docs-line); border-radius: var(--r-sm); background: var(--docs-surface); color: var(--docs-text-soft); cursor: pointer; transition: transform 320ms var(--ease-spring), border 180ms var(--ease-out), color 180ms var(--ease-out); }
          .docs-feedback button:hover, .docs-feedback button.is-selected { transform: scale(1.08); border-color: var(--coral); color: var(--coral); }
          .docs-next-prev { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 48px; }
          .docs-next-prev a { border: 1px solid var(--docs-line); border-radius: var(--r-md); padding: 20px 24px; background: var(--docs-surface); transition: transform 220ms var(--ease-out), border 180ms var(--ease-out), box-shadow 220ms var(--ease-out); }
          .docs-next-prev a:hover { transform: translateY(-2px); border-color: var(--coral); box-shadow: var(--shadow-sm); }
          .docs-next-prev span { display: flex; align-items: center; gap: 6px; color: var(--docs-text-faint); font-size: var(--fs-eyebrow); letter-spacing: 0.12em; }
          .docs-next-prev strong { display: block; margin-top: 4px; color: var(--ink); font-size: var(--fs-body); }
          .docs-next-card { text-align: right; }
          .docs-next-card span { justify-content: flex-end; }
          .docs-table { width: 100%; border-collapse: separate; border-spacing: 0; overflow: hidden; border: 1px solid var(--docs-line); border-radius: var(--r-md); margin: 24px 0; }
          .docs-table thead { background: var(--cream-2); }
          .docs-table th { padding: 12px 16px; color: var(--docs-text-soft); font-size: var(--fs-caption); letter-spacing: 0.08em; text-align: left; text-transform: uppercase; }
          .docs-table td { padding: 14px 16px; border-top: 1px solid var(--docs-line); color: var(--ink); font-size: var(--fs-body); vertical-align: top; }
          .docs-table th, .docs-table td { word-break: keep-all; overflow-wrap: anywhere; }
          .docs-command-table td:first-child { min-width: 86px; font-weight: 700; color: var(--docs-text); }
          .docs-chip { display: inline-flex; padding: 2px 8px; border-radius: 999px; font-size: var(--fs-caption); font-weight: 600; }
          .docs-chip-required { background: rgba(217,119,87,0.12); color: var(--coral-deep); }
          .docs-chip-recommended { background: rgba(90,138,107,0.12); color: var(--success); }
          .docs-chip-remove { background: rgba(201,70,70,0.10); color: #C94646; }
          .docs-faq details { border-top: 1px solid var(--docs-line); padding: 18px 0; }
          .docs-faq summary { cursor: pointer; color: var(--docs-text); font-weight: 600; }
          .docs-legal-fineprint { color: var(--docs-text-faint) !important; font-size: 13px !important; line-height: 1.85 !important; }
          .docs-legal-clauses details { border-top: 1px solid var(--docs-line); padding: 14px 0; }
          .docs-legal-clauses summary { cursor: pointer; color: var(--docs-text-soft); font-size: 13px; font-weight: 600; }
          .docs-legal-clauses p { margin: 10px 0 0; color: var(--docs-text-faint); font-size: 13px; line-height: 1.85; }
          .docs-mini-plan-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 20px 0; }
          .docs-mini-plan-grid article { border: 1px solid var(--docs-line); border-radius: var(--r-md); background: var(--docs-surface); padding: 18px; }
          .docs-mini-plan-grid strong { display: block; color: var(--docs-text); font-size: 16px; }
          .docs-mini-plan-grid span { display: block; margin-top: 6px; color: var(--docs-text-soft); font-size: 13px; line-height: 1.55; }
          .docs-footer { border-top: 1px solid var(--docs-line); padding: 24px 32px; color: var(--docs-text-faint); font-size: var(--fs-caption); }
          .docs-drawer-backdrop { position: fixed; inset: 0; z-index: 90; background: rgba(31,30,29,0.40); backdrop-filter: blur(8px); }
          .docs-drawer { width: 280px; height: 100%; background: var(--docs-bg); border-right: 1px solid var(--docs-line); }
          .docs-drawer .docs-sidebar { position: static; height: 100%; }
          .docs-drawer-close { position: absolute; top: 10px; right: calc(100% - 268px); width: 34px; height: 34px; border: 1px solid var(--docs-line); border-radius: var(--r-sm); background: var(--docs-surface); color: var(--docs-text); }
          @media (max-width: 1279px) {
            .docs-content-shell { grid-template-columns: minmax(0, 760px); }
            .docs-toc { display: none; }
          }
          @media (max-width: 1023px) {
            .docs-header-inner { grid-template-columns: 36px auto 36px 1fr; padding: 0 20px; gap: 12px; }
            .docs-menu-button { display: inline-grid; place-items: center; }
            .docs-search-trigger { display: none; }
            .docs-mobile-search { display: block; justify-self: end; }
            .docs-mobile-search .docs-search-trigger.is-compact { width: 36px; display: inline-grid; place-items: center; padding: 0; }
            .docs-mobile-search .docs-search-trigger.is-compact span, .docs-mobile-search .docs-search-trigger.is-compact kbd { display: none; }
            .docs-shell { display: block; }
            .docs-sidebar-slot { display: none; }
            .docs-content-shell { display: block; padding: 0 32px; }
            .docs-article { margin-inline: auto; }
          }
          @media (max-width: 767px) {
            .docs-header-inner { padding: 0 14px; }
            .docs-brand span { display: none; }
            .docs-header-actions { gap: 0; }
            .docs-header-actions .docs-dashboard-link { padding: 0 10px; }
            .docs-content-shell { padding: 0 24px; }
            .docs-article { padding: 32px 0 80px; }
            .docs-article h1 { font-size: var(--fs-h2); }
            .docs-card-grid, .docs-next-prev { grid-template-columns: 1fr; }
            .docs-feedback { align-items: flex-start; flex-direction: column; }
            .docs-search-overlay { padding: 0; align-items: stretch; }
            .docs-search-modal { min-height: 100dvh; max-height: none; width: 100vw; max-width: none; border-radius: 0; border: 0; }
            .docs-search-results { max-height: calc(100dvh - 56px); }
            .docs-copy-button { opacity: 1; }
            .docs-table { display: block; overflow-x: auto; }
            .docs-table thead { display: none; }
            .docs-table tbody, .docs-table tr, .docs-table td { display: block; width: 100%; white-space: normal; }
            .docs-table tr { border-top: 1px solid var(--docs-line); padding: 10px 0; }
            .docs-table td { border-top: 0; padding: 8px 14px; }
            .docs-mini-plan-grid { grid-template-columns: 1fr; }
          }
          @media (prefers-reduced-motion: reduce) {
            [data-docs] *, [data-docs] *:before, [data-docs] *:after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
              scroll-behavior: auto !important;
            }
          }
        `
        }}
      />
    </div>
  );
}
