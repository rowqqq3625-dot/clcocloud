"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Apple, Check, Copy, Monitor, SquareTerminal, Terminal, X } from "lucide-react";
import { useMemo, useState } from "react";

type DashboardGuideModalProps = {
  apiKey: string;
  open: boolean;
  onClose: () => void;
  onCopied?: (message: string) => void;
};

type GuideTab = {
  id: string;
  label: string;
  icon: typeof Apple;
  lang: string;
  filename: string;
  code: string;
};

function buildTabs(apiKey: string): GuideTab[] {
  return [
    {
      id: "macos",
      label: "macOS",
      icon: Apple,
      lang: "BASH",
      filename: "~/.zshrc",
      code: [
        "sed -i '' '/export ANTHROPIC_API_KEY/d' ~/.zshrc",
        'echo \'export ANTHROPIC_BASE_URL="https://api-anthropic.com/v1"\' >> ~/.zshrc',
        `echo 'export ANTHROPIC_AUTH_TOKEN="${apiKey}"' >> ~/.zshrc`,
        'echo \'export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC="1"\' >> ~/.zshrc',
        "unset ANTHROPIC_API_KEY",
        "source ~/.zshrc",
        "claude /logout",
      ].join("\n"),
    },
    {
      id: "powershell",
      label: "Windows PowerShell",
      icon: SquareTerminal,
      lang: "PS1",
      filename: "PowerShell",
      code: [
        '[Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", $null, "User")',
        '[Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", "https://api-anthropic.com/v1", "User")',
        `[Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", "${apiKey}", "User")`,
        '[Environment]::SetEnvironmentVariable("CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC", "1", "User")',
        '$env:ANTHROPIC_API_KEY=""',
        "claude /logout",
      ].join("\n"),
    },
    {
      id: "cmd",
      label: "Windows CMD",
      icon: Monitor,
      lang: "CMD",
      filename: "Command Prompt",
      code: [
        "REG delete HKCU\\Environment /F /V ANTHROPIC_API_KEY 2>nul",
        'setx ANTHROPIC_BASE_URL "https://api-anthropic.com/v1"',
        `setx ANTHROPIC_AUTH_TOKEN "${apiKey}"`,
        'setx CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC "1"',
        "set ANTHROPIC_API_KEY=",
        "claude /logout",
      ].join("\n"),
    },
    {
      id: "linux",
      label: "Linux",
      icon: Terminal,
      lang: "BASH",
      filename: "~/.bashrc",
      code: [
        "sed -i '/export ANTHROPIC_API_KEY/d' ~/.bashrc",
        'echo \'export ANTHROPIC_BASE_URL="https://api-anthropic.com/v1"\' >> ~/.bashrc',
        `echo 'export ANTHROPIC_AUTH_TOKEN="${apiKey}"' >> ~/.bashrc`,
        'echo \'export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC="1"\' >> ~/.bashrc',
        "unset ANTHROPIC_API_KEY",
        "source ~/.bashrc",
        "claude /logout",
      ].join("\n"),
    },
  ];
}

export function DashboardGuideModal({ apiKey, open, onClose, onCopied }: DashboardGuideModalProps) {
  const tabs = useMemo(() => buildTabs(apiKey), [apiKey]);
  const [activeId, setActiveId] = useState("macos");
  const [copied, setCopied] = useState(false);
  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0];
  const lines = activeTab.code.split("\n");

  async function copyCode() {
    await navigator.clipboard.writeText(activeTab.code);
    setCopied(true);
    onCopied?.("가이드 코드가 복사되었습니다.");
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-ink/45 backdrop-blur-md"
          />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-guide-title"
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 18 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-[1] max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-[30px] border border-white/50 bg-[linear-gradient(180deg,rgba(255,252,246,.96),rgba(247,241,232,.94))] shadow-[0_34px_120px_rgba(31,30,29,.34)] ring-1 ring-black/5"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-primary text-cream shadow-md transition hover:bg-coral"
            >
              <X size={18} />
            </button>

            <div className="max-h-[88vh] overflow-y-auto px-5 py-7 sm:px-8">
              <div className="pr-12">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral/75">SETUP GUIDE</p>
                <h2 id="dashboard-guide-title" className="mt-2 text-[clamp(30px,5vw,54px)] font-[680] tracking-[-0.04em] text-primary">
                  API 환경 변수 설정
                </h2>
              </div>

              <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-cream/70 p-1">
                <div className="flex min-w-max gap-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = tab.id === activeId;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveId(tab.id)}
                        className={`inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${
                          active ? "bg-white text-coral shadow-sm ring-1 ring-coral/20" : "text-secondary hover:bg-white/70 hover:text-primary"
                        }`}
                      >
                        <Icon size={14} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <figure className="mt-6 overflow-hidden rounded-[18px] border border-black/15 bg-[#151312] shadow-[0_24px_70px_rgba(31,30,29,.28)]">
                <figcaption className="flex h-11 items-center justify-between border-b border-white/10 bg-[linear-gradient(180deg,#302b28,#211e1c)] px-4">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5" aria-hidden="true">
                      <i className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                      <i className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                      <i className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                    </span>
                    <span className="font-mono text-xs" style={{ color: "rgba(255, 255, 255, 0.85)" }}>{activeTab.filename}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-white/10 px-2 py-1 font-mono text-[11px] font-bold" style={{ color: "rgba(255, 255, 255, 0.75)" }}>{activeTab.lang}</span>
                    <button
                      type="button"
                      onClick={copyCode}
                      aria-label="코드 복사"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.04] transition hover:text-white"
                      style={{ color: "rgba(255, 255, 255, 0.75)" }}
                    >
                      {copied ? <Check size={15} /> : <Copy size={15} />}
                    </button>
                  </div>
                </figcaption>
                <pre className="overflow-x-auto p-0 text-[13px] leading-7 text-cream">
                  <code>
                    {lines.map((line, index) => (
                      <span key={`${activeTab.id}-${index}`} className={`grid grid-cols-[44px_1fr] border-l-2 ${index === 2 ? "border-coral bg-coral/14" : "border-transparent"}`}>
                        <span className="select-none pr-4 text-right font-mono text-white/30">{index + 1}</span>
                        <span className="whitespace-pre pr-5 font-mono text-white/90">{line || " "}</span>
                      </span>
                    ))}
                  </code>
                </pre>
              </figure>

              <div className="mt-5 flex justify-end">
                <a
                  href="/docs/installation#environment"
                  className="text-xs font-semibold text-secondary/55 underline decoration-transparent underline-offset-4 transition hover:text-coral hover:decoration-coral/40"
                >
                  자세히보기
                </a>
              </div>
            </div>
          </motion.section>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
