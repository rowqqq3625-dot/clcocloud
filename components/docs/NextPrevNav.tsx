import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getPrevNext } from "@/lib/docs/navigation";

export function NextPrevNav({ pathname }: { pathname: string }) {
  const { prev, next } = getPrevNext(pathname);
  return (
    <nav className="docs-next-prev" aria-label="이전 다음 문서">
      {prev ? (
        <Link href={prev.href} className="docs-prev-card">
          <span>
            <ArrowLeft size={14} />
            PREV
          </span>
          <strong>{prev.title}</strong>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link href={next.href} className="docs-next-card">
          <span>
            NEXT
            <ArrowRight size={14} />
          </span>
          <strong>{next.title}</strong>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
