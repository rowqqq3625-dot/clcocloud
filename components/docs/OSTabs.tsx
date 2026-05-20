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
          const Icon = icons[tab.icon as TabIcon] ?? Terminal;
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
