"use client";

import { useEffect, useState } from "react";

export function PageProgressBar() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDone(true), 650);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <span
      aria-hidden="true"
      className={`fixed left-0 top-0 z-[120] h-px bg-coral shadow-coral transition-[width,opacity] duration-700 ease-cinematic ${done ? "w-full opacity-0" : "w-0 opacity-100"}`}
    />
  );
}
