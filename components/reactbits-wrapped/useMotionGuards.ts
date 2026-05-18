"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

export function useIsDesktop(minWidth = 1024) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${minWidth}px)`);
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [minWidth]);

  return isDesktop;
}

export function useMotionEnabled(minWidth = 1024) {
  const reduced = useReducedMotion();
  const isDesktop = useIsDesktop(minWidth);
  return isDesktop && !reduced;
}
