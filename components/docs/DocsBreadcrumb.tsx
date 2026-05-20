import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { getTitleByPath } from "@/lib/docs/navigation";

export function DocsBreadcrumb({ pathname }: { pathname: string }) {
  const title = getTitleByPath(pathname);
  return (
    <nav className="docs-breadcrumb" aria-label="Breadcrumb">
      <Link href="/docs">Docs</Link>
      <ChevronRight size={12} aria-hidden="true" />
      <span>{title}</span>
    </nav>
  );
}
