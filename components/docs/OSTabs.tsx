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

const WindowsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
);

const PenguinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2a4 4 0 0 0-4 4v2a6 6 0 0 0-3.3 5.3a2 2 0 0 0-.7 1.5 1.5 1.5 0 0 0 1.5 1.5h1a4.5 4.5 0 0 0 4.5 4.5h2a4.5 4.5 0 0 0 4.5-4.5h1a1.5 1.5 0 0 0 1.5-1.5 2 2 0 0 0-.7-1.5A6 6 0 0 0 16 8V6a4 4 0 0 0-4-4z"/>
    <path d="M9.5 8.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>
    <path d="M14.5 8.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>
    <path d="M11.5 10.5h1a1 1 0 0 1 1 1v0a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v0a1 1 0 0 1 1-1z"/>
    <path d="M8 17.5a2.5 2.5 0 0 1-2.5-2.5v-1.5"/>
    <path d="M16 17.5a2.5 2.5 0 0 0 2.5-2.5v-1.5"/>
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
            Icon = Apple;
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
