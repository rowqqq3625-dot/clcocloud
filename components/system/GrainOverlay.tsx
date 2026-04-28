type GrainOverlayProps = {
  className?: string;
  glowPosition?: "top-right" | "bottom-left" | "center-right";
};

export function GrainOverlay({
  className = "",
  glowPosition = "top-right"
}: GrainOverlayProps) {
  const glowClass =
    glowPosition === "bottom-left"
      ? "-bottom-24 -left-24"
      : glowPosition === "center-right"
        ? "right-0 top-1/2 -translate-y-1/2"
        : "-right-24 -top-24";

  return (
    <>
      <div className={`pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent,var(--surface-dark))] opacity-30 ${className}`} />
      <div className={`pointer-events-none absolute ${glowClass} h-[420px] w-[420px] rounded-full bg-coral opacity-[.08] blur-[200px]`} />
      <div className="pointer-events-none absolute inset-0 opacity-[.06] noise" />
    </>
  );
}
