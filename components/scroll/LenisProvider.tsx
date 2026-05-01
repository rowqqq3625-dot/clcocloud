"use client";

import Lenis from "lenis";
import { useEffect } from "react";

declare global {
  interface Window {
    __clcoLenis?: Lenis;
  }
}

export function LenisProvider() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true
    });
    window.__clcoLenis = lenis;

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      if (window.__clcoLenis === lenis) {
        window.__clcoLenis = undefined;
      }
      lenis.destroy();
    };
  }, []);

  return null;
}
