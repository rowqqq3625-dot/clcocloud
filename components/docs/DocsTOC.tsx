"use client";

import type { Heading } from "@/lib/docs/toc";
import { useEffect, useState } from "react";

export function DocsTOC({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState(headings[0]?.id);

  useEffect(() => {
    const nodes = headings.map((heading) => document.getElementById(heading.id)).filter(Boolean) as HTMLElement[];
    if (!nodes.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-20% 0% -70% 0%" }
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [headings]);

  if (!headings.length) return <aside className="docs-toc" aria-hidden="true" />;

  return (
    <nav className="docs-toc" aria-label="목차">
      <h2>ON THIS PAGE</h2>
      {headings.map((heading) => (
        <a
          key={heading.id}
          href={`#${heading.id}`}
          className={`${active === heading.id ? "is-active" : ""} ${heading.level === 3 ? "is-h3" : ""}`}
        >
          {heading.title}
        </a>
      ))}
    </nav>
  );
}
