"use client";

export function ShinyText({ text, className = "" }: { text: string; className?: string }) {
  return <span className={className}>{text}</span>;
}
