"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, X } from "lucide-react";
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
  lang: string;
  filename: string;
  code: string;
};

const AppleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
    <path d="M17.05 20.28c-.98.95-2.05 1.88-3.08 1.88-1.07 0-1.39-.62-2.61-.62-1.22 0-1.58.62-2.61.62-1.03 0-2.15-.98-3.08-1.88-1.92-1.87-3.39-5.28-3.39-8.21 0-4.64 3.01-7.09 5.86-7.09 1.52 0 2.8.94 3.69.94.88 0 2.22-.97 3.99-.97 1.83 0 3.25.92 4.1 2.16-3.48 2.05-2.91 6.32.22 7.57-1.12 2.76-2.58 5.37-4.1 7.09zM12.03 5.08c1.11-1.36 1.85-3.23 1.64-5.08-1.59.06-3.52 1.06-4.66 2.39-1 1.15-1.88 3.06-1.64 4.88 1.77.14 3.55-.83 4.66-2.19z" />
  </svg>
);

const WindowsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
    <path d="M0 3.449L9.75 2.1v9.45H0V3.449zM0 12.45h9.75v9.45L0 20.55v-8.1zM10.8 1.95L24 0v11.55H10.8V1.95zM10.8 12.45H24v11.55l-13.2-1.95v-9.6z" />
  </svg>
);

const PenguinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
    <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 01-.004-.021l-.004-.024a1.807 1.807 0 01-.15.706.953.953 0 01-.213.335.71.71 0 00-.088-.042c-.104-.045-.198-.064-.284-.133a1.312 1.312 0 00-.22-.066c.05-.06.146-.133.183-.198.053-.128.082-.264.088-.402v-.02a1.21 1.21 0 00-.061-.4c-.045-.134-.101-.2-.183-.333-.084-.066-.167-.132-.267-.132h-.016c-.093 0-.176.03-.262.132a.8.8 0 00-.205.334 1.18 1.18 0 00-.09.4v.019c.002.089.008.179.02.267-.193-.067-.438-.135-.607-.202a1.635 1.635 0 01-.018-.2v-.02a1.772 1.772 0 01.15-.768c.082-.22.232-.406.43-.533a.985.985 0 01.594-.2zm-2.962.059h.036c.142 0 .27.048.399.135.146.129.264.288.344.465.09.199.14.4.153.667v.004c.007.134.006.2-.002.266v.08c-.03.007-.056.018-.083.024-.152.055-.274.135-.393.2.012-.09.013-.18.003-.267v-.015c-.012-.133-.04-.2-.082-.333a.613.613 0 00-.166-.267.248.248 0 00-.183-.064h-.021c-.071.006-.13.04-.186.132a.552.552 0 00-.12.27.944.944 0 00-.023.33v.015c.012.135.037.2.08.334.046.134.098.2.166.268.01.009.02.018.034.024-.07.057-.117.07-.176.136a.304.304 0 01-.131.068 2.62 2.62 0 01-.275-.402 1.772 1.772 0 01-.155-.667 1.759 1.759 0 01.08-.668 1.43 1.43 0 01.283-.535c.128-.133.26-.2.418-.2zm1.37 1.706c.332 0 .733.065 1.216.399.293.2.523.269 1.052.468h.003c.255.136.405.266.478.399v-.131a.571.571 0 01.016.47c-.123.31-.516.643-1.063.842v.002c-.268.135-.501.333-.775.465-.276.135-.588.292-1.012.267a1.139 1.139 0 01-.448-.067 3.566 3.566 0 01-.322-.198c-.195-.135-.363-.332-.612-.465v-.005h-.005c-.4-.246-.616-.512-.686-.71-.07-.268-.005-.47.193-.6.224-.135.38-.271.483-.336.104-.074.143-.102.176-.131h.002v-.003c.169-.202.436-.47.839-.601.139-.036.294-.065.466-.065zm2.8 2.142c.358 1.417 1.196 3.475 1.735 4.473.286.534.855 1.659 1.102 3.024.156-.005.33.018.513.064.646-1.671-.546-3.467-1.089-3.966-.22-.2-.232-.335-.123-.335.59.534 1.365 1.572 1.646 2.757.13.535.16 1.104.021 1.67.067.028.135.06.205.067 1.032.534 1.413.938 1.23 1.537v-.043c-.06-.003-.12 0-.18 0h-.016c.151-.467-.182-.825-1.065-1.224-.915-.4-1.646-.336-1.77.465-.008.043-.013.066-.018.135-.068.023-.139.053-.209.064-.43.268-.662.669-.793 1.187-.13.533-.17 1.156-.205 1.869v.003c-.02.334-.17.838-.319 1.35-1.5 1.072-3.58 1.538-5.348.334a2.645 2.645 0 00-.402-.533 1.45 1.45 0 00-.275-.333c.182 0 .338-.03.465-.067a.615.615 0 00.314-.334c.108-.267 0-.697-.345-1.163-.345-.467-.931-.995-1.788-1.521-.63-.4-.986-.87-1.15-1.396-.165-.534-.143-1.085-.015-1.645.245-1.07.873-2.11 1.274-2.763.107-.065.037.135-.408.974-.396.751-1.14 2.497-.122 3.854a8.123 8.123 0 01.647-2.876c.564-1.278 1.743-3.504 1.836-5.268.048.036.217.135.289.202.218.133.38.333.59.465.21.201.477.335.876.335.039.003.075.006.11.006.412 0 .73-.134.997-.268.29-.134.52-.334.74-.4h.005c.467-.135.835-.402 1.044-.7zm2.185 8.958c.037.6.343 1.245.882 1.377.588.134 1.434-.333 1.791-.765l.211-.01c.315-.007.577.01.847.268l.003.003c.208.199.305.53.391.876.085.4.154.78.409 1.066.486.527.645.906.636 1.14l.003-.007v.018l-.003-.012c-.015.262-.185.396-.498.595-.63.401-1.746.712-2.457 1.57-.618.737-1.37 1.14-2.036 1.191-.664.053-1.237-.2-1.574-.898l-.005-.003c-.21-.4-.12-1.025.056-1.69.176-.668.428-1.344.463-1.897.037-.714.076-1.335.195-1.814.12-.465.308-.797.641-.984l.045-.022zm-10.814.049h.01c.053 0 .105.005.157.014.376.055.706.333 1.023.752l.91 1.664.003.003c.243.533.754 1.064 1.189 1.637.434.598.77 1.131.729 1.57v.006c-.057.744-.48 1.148-1.125 1.294-.645.135-1.52.002-2.395-.464-.968-.536-2.118-.469-2.857-.602-.369-.066-.61-.2-.723-.4-.11-.2-.113-.602.123-1.23v-.004l.002-.003c.117-.334.03-.752-.027-1.118-.055-.401-.083-.71.043-.94.16-.334.396-.4.69-.533.294-.135.64-.202.915-.47h.002v-.002c.256-.268.445-.601.668-.838.19-.201.38-.336.663-.336zm7.159-9.074c-.435.201-.945.535-1.488.535-.542 0-.97-.267-1.28-.466-.154-.134-.28-.268-.373-.335-.164-.134-.144-.333-.074-.333.109.016.129.134.199.2.096.066.215.2.36.333.292.2.68.467 1.167.467.485 0 1.053-.267 1.398-.466.195-.135.445-.334.648-.467.156-.136.149-.267.279-.267.128.016.034.134-.147.332a8.097 8.097 0 01-.69.468zm-1.082-1.583V5.64c-.006-.02.013-.042.029-.05.074-.043.18-.027.26.004.063 0 .16.067.15.135-.006.049-.085.066-.135.066-.055 0-.092-.043-.141-.068-.052-.018-.146-.008-.163-.065zm-.551 0c-.02.058-.113.049-.166.066-.047.025-.086.068-.14.068-.05 0-.13-.02-.136-.068-.01-.066.088-.133.15-.133.08-.031.184-.047.259-.005.019.009.036.03.03.05v.02h.003z" />
  </svg>
);

function buildTabs(apiKey: string): GuideTab[] {
  return [
    {
      id: "macos",
      label: "macOS",
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
                  <span className="font-serif italic font-medium text-[var(--coral,#ff7f50)] tracking-tight pr-1.5" style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic" }}>
                    API 키
                  </span>{" "}
                  환경변수 설정
                </h2>
              </div>

              <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-cream/70 p-1">
                <div className="flex min-w-max gap-1">
                  {tabs.map((tab) => {
                    const active = tab.id === activeId;
                    let IconComponent = AppleIcon;
                    if (tab.id === "macos") {
                      IconComponent = AppleIcon;
                    } else if (tab.id === "powershell" || tab.id === "cmd") {
                      IconComponent = WindowsIcon;
                    } else if (tab.id === "linux") {
                      IconComponent = PenguinIcon;
                    }
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveId(tab.id)}
                        className={`inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${
                          active ? "bg-white text-coral shadow-sm ring-1 ring-coral/20" : "text-secondary hover:bg-white/70 hover:text-primary"
                        }`}
                      >
                        <IconComponent style={{ width: "14px", height: "14px" }} />
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
