"use client";

import { useEffect, useRef, useState } from "react";

export function CursorFollower() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || window.matchMedia("(pointer: coarse)").matches) return;

    const move = (event: MouseEvent) => {
      const dot = dotRef.current;
      if (!dot) return;
      dot.style.transform = `translate3d(${event.clientX - 5}px, ${event.clientY - 5}px, 0)`;
    };
    const over = (event: MouseEvent) => {
      const target = event.target;
      setVisible(target instanceof Element && Boolean(target.closest("a, button, [role='button'], input")));
    };

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", over, { passive: true });
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
    };
  }, []);

  return (
    <div
      ref={dotRef}
      className={`pointer-events-none fixed left-0 top-0 z-[100] h-2.5 w-2.5 rounded-full bg-coral shadow-coral transition-opacity duration-150 ${visible ? "opacity-100" : "opacity-0"}`}
    />
  );
}
