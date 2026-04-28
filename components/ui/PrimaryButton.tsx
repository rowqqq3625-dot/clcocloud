"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { motion } from "framer-motion";
import { useState } from "react";
import { squashTap } from "@/lib/motion";

type PrimaryButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "dark" | "light";
  arrow?: "↘" | "↗" | "→";
  pulse?: boolean;
};

export function PrimaryButton({
  href,
  children,
  variant = "dark",
  arrow = "↘",
  pulse = false
}: PrimaryButtonProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const base =
    variant === "dark"
      ? "bg-primary text-cream"
      : "bg-cream text-primary";

  const createRipple = (event: MouseEvent<HTMLAnchorElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((current) => [
      ...current,
      { id, x: event.clientX - rect.left, y: event.clientY - rect.top }
    ]);
    window.setTimeout(() => {
      setRipples((current) => current.filter((ripple) => ripple.id !== id));
    }, 500);
  };

  return (
    <motion.div whileTap={squashTap} className="inline-flex">
      <Link
        href={href}
        onClick={createRipple}
        className={`group relative inline-flex min-h-12 items-center gap-px overflow-hidden rounded-xl p-1 pl-5 text-[15px] font-semibold shadow-md transition duration-200 ease-cinematic will-change-transform hover:-translate-y-px hover:shadow-lg active:scale-[.97] ${base}`}
      >
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="pointer-events-none absolute h-5 w-5 rounded-full bg-coral/60 animate-ripple-expand"
            style={{ left: ripple.x - 10, top: ripple.y - 10 }}
          />
        ))}
        <span className="relative z-[1] pr-4 transition-colors duration-200">{children}</span>
        <span
          className={`relative z-[1] grid min-h-10 min-w-10 place-items-center rounded-lg bg-coral px-3 text-cream transition-all duration-200 group-hover:min-w-[3.2rem] group-hover:bg-coral-hi group-hover:shadow-coral ${pulse ? "animate-arrow-pulse" : ""}`}
        >
          <span className="transition-transform duration-200 group-hover:translate-x-1">
            {arrow}
          </span>
        </span>
      </Link>
    </motion.div>
  );
}
