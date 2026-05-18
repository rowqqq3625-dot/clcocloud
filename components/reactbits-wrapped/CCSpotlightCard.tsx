"use client";

import type { CSSProperties, ElementType, ReactNode } from "react";
import { useMotionEnabled } from "./useMotionGuards";

type CCSpotlightCardProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
  radius?: number;
};

export function CCSpotlightCard({
  as: Component = "div",
  children,
  className = "",
  spotlightColor = "rgba(217,119,87,0.14)",
  radius = 260
}: CCSpotlightCardProps) {
  const enabled = useMotionEnabled();

  return (
    <Component
      className={`relative ${enabled ? "group/spotlight" : ""} ${className}`}
      style={{
        "--spotlight-color": spotlightColor,
        "--spotlight-radius": `${radius}px`
      } as CSSProperties}
    >
      {enabled ? <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 [background:radial-gradient(var(--spotlight-radius)_circle_at_50%_0%,var(--spotlight-color),transparent_70%)] group-hover/spotlight:opacity-100" /> : null}
      {children}
    </Component>
  );
}
