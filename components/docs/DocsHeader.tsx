"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { DocsSearch } from "./DocsSearch";
import { DocsSidebar } from "./DocsSidebar";

export function DocsHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="docs-header">
        <div className="docs-header-inner">
          <button type="button" className="docs-menu-button" onClick={() => setOpen(true)} aria-label="문서 메뉴 열기">
            <Menu size={18} />
          </button>
          <Link href="/docs" className="docs-brand">
            <Image src="/clcocloud-logo.png" alt="클코클라우드" width={24} height={24} />
            <span>클코클라우드</span>
            <em>docs</em>
          </Link>
          <DocsSearch />
          <div className="docs-mobile-search">
            <DocsSearch compact />
          </div>
          <div className="docs-header-actions">
            <Link href="/dashboard" className="docs-dashboard-link">
              대시보드 →
            </Link>
          </div>
        </div>
      </header>
      <AnimatePresence>
        {open ? (
          <motion.div className="docs-drawer-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.aside
              className="docs-drawer"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <button type="button" className="docs-drawer-close" onClick={() => setOpen(false)} aria-label="문서 메뉴 닫기">
                <X size={18} />
              </button>
              <DocsSidebar onNavigate={() => setOpen(false)} />
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
