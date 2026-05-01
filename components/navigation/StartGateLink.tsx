"use client";

import type { MouseEvent, ReactNode } from "react";

type StartGateLinkProps = {
  children: ReactNode;
  className?: string;
};

export function StartGateLink({ children, className }: StartGateLinkProps) {
  const handleClick = async (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    try {
      const response = await fetch("/api/session", {
        cache: "no-store",
        credentials: "same-origin"
      });
      const data = (await response.json()) as { authenticated?: boolean };
      window.location.href = data.authenticated ? "/mypage" : "/start";
    } catch {
      window.location.href = "/start";
    }
  };

  return (
    <a href="/start" className={className} onClick={handleClick}>
      {children}
    </a>
  );
}
