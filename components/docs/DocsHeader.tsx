"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
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
          <div className="docs-brand flex items-center gap-[9px]">
            <Link href="/" className="flex items-center gap-[9px] hover:opacity-80 transition-opacity" style={{ color: "inherit", textDecoration: "none" }}>
              <BrandLogo size={24} />
              <span>클코클라우드</span>
            </Link>
            <Link href="/docs" className="hover:opacity-80 transition-opacity" style={{ textDecoration: "none" }}>
              <em>docs</em>
            </Link>
          </div>
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
