"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV } from "@/lib/docs/navigation";

export function DocsSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    setOpenGroups((current) => {
      const next = { ...current };
      for (const group of NAV) {
        if (group.items.some((item) => item.href.split("#")[0] === pathname)) {
          next[group.group] = true;
        } else if (typeof next[group.group] === "undefined") {
          next[group.group] = group.group === "시작하기";
        }
      }
      return next;
    });
  }, [pathname]);

  return (
    <nav className="docs-sidebar" aria-label="문서 내비게이션">
      {NAV.map((group) => {
        const open = openGroups[group.group] ?? group.group === "시작하기";
        return (
          <section key={group.group}>
            <button
              type="button"
              className="docs-sidebar-group-trigger"
              aria-expanded={open}
              onClick={() => setOpenGroups((current) => ({ ...current, [group.group]: !open }))}
            >
              <span>{group.group}</span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            {open ? (
              <ul>
                {group.items.map((item) => {
                  const baseHref = item.href.split("#")[0];
                  const itemHash = item.href.includes("#") ? `#${item.href.split("#")[1]}` : "";
                  const active = itemHash ? pathname === baseHref && hash === itemHash : pathname === baseHref && !hash;
                  const nested = item.href.includes("#");
                  return (
                    <li key={item.href} className={nested ? "is-nested" : ""}>
                      <Link href={item.href} className={active ? "is-active" : ""} onClick={onNavigate}>
                        {active ? <motion.span className="docs-sidebar-indicator" layoutId="docs-sidebar-active" /> : null}
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </section>
        );
      })}
    </nav>
  );
}
