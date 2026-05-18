"use client";

import type { CSSProperties, ElementType, ReactNode } from "react";

type SpotlightCardProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
  radius?: number;
};

export function SpotlightCard({
  as: Component = "div",
  children,
  className = "",
  spotlightColor = "rgba(217,119,87,0.14)",
  radius = 260
}: SpotlightCardProps) {
  return (
    <Component
      className={`group/spotlight relative ${className}`}
      style={{
        "--spotlight-color": spotlightColor,
        "--spotlight-radius": `${radius}px`
      } as CSSProperties}
    >
      <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 [background:radial-gradient(var(--spotlight-radius)_circle_at_50%_0%,var(--spotlight-color),transparent_70%)] group-hover/spotlight:opacity-100" />
      {children}
    </Component>
  );
}
