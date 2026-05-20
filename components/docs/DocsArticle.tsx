"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { DocsBreadcrumb } from "./DocsBreadcrumb";
import { DocsTOC } from "./DocsTOC";
import { FeedbackBar } from "./FeedbackBar";
import { NextPrevNav } from "./NextPrevNav";
import type { Heading } from "@/lib/docs/toc";

type DocsArticleProps = {
  pathname: string;
  headings: Heading[];
  children: ReactNode;
};

export function DocsArticle({ pathname, headings, children }: DocsArticleProps) {
  return (
    <>
      <motion.article
        className="docs-article"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        <DocsBreadcrumb pathname={pathname} />
        {children}
        <FeedbackBar />
        <NextPrevNav pathname={pathname} />
      </motion.article>
      <DocsTOC headings={headings} />
    </>
  );
}
