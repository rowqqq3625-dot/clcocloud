"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { motion } from "framer-motion";
import { useState } from "react";
import { squashTap } from "@/lib/motion";

type PrimaryButtonProps = {
  href?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
  variant?: "dark" | "light" | "coral-solid" | "secondary";
  arrow?: "↘" | "↗" | "→";
  pulse?: boolean;
  className?: string;
};

export function PrimaryButton({
  href,
  onClick,
  children,
  variant = "dark",
  arrow = "↘",
  pulse = false,
  className = ""
}: PrimaryButtonProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  
  const base =
    variant === "dark"
      ? "bg-primary text-cream border border-transparent"
      : variant === "light"
      ? "bg-cream text-primary border border-transparent"
      : variant === "coral-solid"
      ? "bg-coral text-cream border border-coral-deep hover:bg-coral-deep"
      : "bg-cream text-coral border border-coral/30 hover:border-coral/60";

  const createRipple = (clientX: number, clientY: number, currentTarget: HTMLElement) => {
    const rect = currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((current) => [
      ...current,
      { id, x: clientX - rect.left, y: clientY - rect.top }
    ]);
    window.setTimeout(() => {
      setRipples((current) => current.filter((ripple) => ripple.id !== id));
    }, 500);
  };

  const content = (
    <>
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
    </>
  );

  const combinedClassName = `group relative inline-flex min-h-12 items-center justify-between gap-px overflow-hidden rounded-xl p-1 pl-5 text-[15px] font-semibold shadow-md transition duration-200 ease-cinematic will-change-transform hover:-translate-y-px hover:shadow-lg active:scale-[.97] ${base} ${className}`;

  if (href) {
    return (
      <motion.div whileTap={squashTap} className="inline-flex w-full">
        <Link
          href={href}
          onClick={(e) => createRipple(e.clientX, e.clientY, e.currentTarget)}
          className={combinedClassName}
        >
          {content}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div whileTap={squashTap} className="inline-flex w-full">
      <button
        type="button"
        onClick={(e) => {
          createRipple(e.clientX, e.clientY, e.currentTarget);
          if (onClick) onClick(e);
        }}
        className={combinedClassName}
      >
        {content}
      </button>
    </motion.div>
  );
}
