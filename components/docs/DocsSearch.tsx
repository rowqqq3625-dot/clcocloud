"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { SEARCH_INDEX } from "@/lib/docs/search-index";

export function DocsSearch({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SEARCH_INDEX.slice(0, 8);
    return SEARCH_INDEX.filter((entry) =>
      `${entry.title} ${entry.section} ${entry.snippet} ${entry.href}`.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [query]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("docs-search-open");
    return () => document.body.classList.remove("docs-search-open");
  }, [open]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const modal = (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="docs-search-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="문서 검색"
          onPointerDown={() => setOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="docs-search-modal"
            onPointerDown={(event) => event.stopPropagation()}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="docs-search-input-row">
              <Search size={18} aria-hidden="true" />
              <input
                autoFocus
                value={query}
                placeholder="키워드 입력 …"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setActive((value) => Math.min(value + 1, results.length - 1));
                  }
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setActive((value) => Math.max(value - 1, 0));
                  }
                  if (event.key === "Enter" && results[active]) {
                    setOpen(false);
                    window.location.href = results[active].href;
                  }
                }}
              />
              <button type="button" onClick={() => setOpen(false)} aria-label="검색 닫기">
                <X size={18} />
              </button>
            </div>
            <div className="docs-search-results">
              {results.map((entry, index) => (
                <Link
                  key={`${entry.href}-${entry.title}`}
                  href={entry.href}
                  className={index === active ? "is-active" : ""}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => setOpen(false)}
                >
                  <span>
                    <strong>{entry.title}</strong>
                    <small>{entry.snippet}</small>
                  </span>
                  <em>{entry.section}</em>
                </Link>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return (
    <>
      <button
        type="button"
        className={`docs-search-trigger ${compact ? "is-compact" : ""}`}
        onClick={() => setOpen(true)}
        aria-label="문서 검색"
      >
        <Search size={16} aria-hidden="true" />
        <span>문서 검색 …</span>
        <kbd>⌘K</kbd>
      </button>
      {mounted ? createPortal(modal, document.body) : null}
    </>
  );
}
