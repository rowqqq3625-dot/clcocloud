"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Apple, Monitor, SquareTerminal, Terminal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CodeBlock } from "./CodeBlock";

type TabIcon = "terminal" | "apple" | "monitor" | "square-terminal";
export type OSTab = {
  id: string;
  label: string;
  icon: TabIcon | string;
  code: string;
  lang: string;
  filename?: string;
};

const AppleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="#8E8E93" {...props}>
    <path d="M17.05 20.28c-.98.95-2.05 1.88-3.08 1.88-1.07 0-1.39-.62-2.61-.62-1.22 0-1.58.62-2.61.62-1.03 0-2.15-.98-3.08-1.88-1.92-1.87-3.39-5.28-3.39-8.21 0-4.64 3.01-7.09 5.86-7.09 1.52 0 2.8.94 3.69.94.88 0 2.22-.97 3.99-.97 1.83 0 3.25.92 4.1 2.16-3.48 2.05-2.91 6.32.22 7.57-1.12 2.76-2.58 5.37-4.1 7.09zM12.03 5.08c1.11-1.36 1.85-3.23 1.64-5.08-1.59.06-3.52 1.06-4.66 2.39-1 1.15-1.88 3.06-1.64 4.88 1.77.14 3.55-.83 4.66-2.19z" />
  </svg>
);

const WindowsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="#8E8E93" {...props}>
    <path d="M0 3.449L9.75 2.1v9.45H0V3.449zM0 12.45h9.75v9.45L0 20.55v-8.1zM10.8 1.95L24 0v11.55H10.8V1.95zM10.8 12.45H24v11.55l-13.2-1.95v-9.6z" />
  </svg>
);

const PenguinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="#8E8E93" {...props}>
    <path d="M12 .002c-3.13 0-5.67 2.541-5.67 5.671 0 .769.155 1.498.432 2.164C5.074 8.784 4.09 9.866 4.09 11.18c0 1.391 1.128 2.52 2.52 2.52.285 0 .559-.047.814-.135C8.536 15.092 10.15 16.03 12 16.03c1.85 0 3.464-.938 4.576-2.465.255.088.529.135.814.135 1.392 0 2.52-1.129 2.52-2.52 0-1.314-.984-2.396-2.672-3.343.277-.666.432-1.395.432-2.164 0-3.13-2.54-5.671-5.67-5.671zm.789 3.946c.433 0 .789.355.789.789s-.356.789-.789.789-.789-.355-.789-.789.356-.789.789-.789zm-3.947 0c.433 0 .789.355.789.789s-.356.789-.789.789-.789-.355-.789-.789.356-.789.789-.789zm2.758 5.918c-.655 0-1.185-.53-1.185-1.186h2.37c0 .656-.53 1.186-1.185 1.186zM12 18.066c-.98 0-1.895-.236-2.709-.646-.226.793-.728 1.48-1.392 1.956-.547.393-1.2.628-1.909.628h-1.9v1.9c0 1.391 1.129 2.52 2.52 2.52h5.67c1.391 0 2.52-1.129 2.52-2.52v-1.9h-1.9c-.71 0-1.362-.235-1.91-.628-.663-.476-1.165-1.163-1.391-1.956-.814.41-1.729.646-2.709.646z" />
  </svg>
);

const icons = {
  terminal: Terminal,
  apple: Apple,
  monitor: Monitor,
  "square-terminal": SquareTerminal
};

function detectOS(tabs: OSTab[]) {
  if (typeof navigator === "undefined") return tabs[0]?.id;
  const platform = `${navigator.platform} ${navigator.userAgent}`.toLowerCase();
  if (platform.includes("mac")) return tabs.find((tab) => tab.id === "macos")?.id ?? tabs[0]?.id;
  if (platform.includes("win")) return tabs.find((tab) => tab.id === "ps")?.id ?? tabs[0]?.id;
  return tabs.find((tab) => tab.id === "linux")?.id ?? tabs[0]?.id;
}

export function OSTabs({
  tabs,
  storageKey = "docs:os",
  label = "운영 체제 선택"
}: {
  tabs: OSTab[] | readonly OSTab[];
  storageKey?: string;
  label?: string;
}) {
  const normalizedTabs = useMemo(() => [...tabs], [tabs]);
  const [activeId, setActiveId] = useState<string | undefined>(normalizedTabs[0]?.id);
  const [expanded, setExpanded] = useState(true);
  const activeTab = normalizedTabs.find((tab) => tab.id === activeId);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    const next = saved && normalizedTabs.some((tab) => tab.id === saved) ? saved : detectOS(normalizedTabs);
    setActiveId(next);
    setExpanded(true);
  }, [normalizedTabs, storageKey]);

  function selectTab(id: string) {
    if (id === activeId) {
      setExpanded((value) => !value);
      return;
    }
    setActiveId(id);
    setExpanded(true);
    window.localStorage.setItem(storageKey, id);
  }

  function move(delta: number) {
    const index = normalizedTabs.findIndex((tab) => tab.id === activeId);
    const next = normalizedTabs[(index + delta + normalizedTabs.length) % normalizedTabs.length];
    selectTab(next.id);
  }

  return (
    <section className="docs-os-tabs">
      <div className="docs-os-tablist" aria-label={label}>
        {normalizedTabs.map((tab) => {
          let Icon = Terminal;
          if (tab.id === "macos") {
            Icon = AppleIcon as any;
          } else if (tab.id === "ps" || tab.id === "cmd") {
            Icon = WindowsIcon as any;
          } else if (tab.id === "linux") {
            Icon = PenguinIcon as any;
          } else {
            Icon = (icons[tab.icon as TabIcon] ?? Terminal) as any;
          }
          const active = tab.id === activeId;
          return (
            <button
              type="button"
              aria-pressed={active && expanded}
              aria-expanded={active ? expanded : undefined}
              key={tab.id}
              className={active ? "is-active" : ""}
              onClick={() => selectTab(tab.id)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") move(1);
                if (event.key === "ArrowLeft") move(-1);
              }}
            >
              <Icon size={14} aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        {expanded && activeTab ? (
          <motion.div
            key={activeTab.id}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            <CodeBlock
              code={activeTab.code}
              lang={activeTab.lang}
              filename={activeTab.filename}
              highlightLines={[2, 3]}
              showLineNumbers
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
