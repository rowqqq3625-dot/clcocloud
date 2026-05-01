"use client";

import { useEffect, useRef } from "react";

export type MouseRef = {
  x: number;
  y: number;
};

export function useMouseRef(disabled = false) {
  const mouseRef = useRef<MouseRef>({ x: 0, y: 0 });

  useEffect(() => {
    if (disabled) return;
    const onMove = (event: PointerEvent) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };
    const onLeave = () => {
      mouseRef.current.x = 0;
      mouseRef.current.y = 0;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [disabled]);

  return mouseRef;
}
