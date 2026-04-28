import type { ReactNode } from "react";

export function centerEllipsis(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  const edge = Math.max(3, Math.floor((maxLength - 3) / 2));
  return `${value.slice(0, edge)}...${value.slice(-edge)}`;
}

export function insertWordBreaks(value: string) {
  return value.replaceAll("/", "/\u200b").replaceAll("-", "-\u200b").replaceAll("_", "_\u200b");
}

export function nowrapMixedText(value: string): ReactNode {
  return value.split(" ").map((part, index, array) => (
    `${part}${index < array.length - 1 ? "\u00A0" : ""}`
  )).join("");
}
