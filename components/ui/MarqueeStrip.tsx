export function MarqueeStrip() {
  return (
    <div className="marquee-mask group relative flex h-20 items-center overflow-hidden border-y border-[var(--border-dark)] bg-[linear-gradient(90deg,var(--surface-dark),var(--surface-dark-2))]" data-nosnippet>
      <div className="flex min-w-full animate-[marquee_120s_linear_infinite] items-center gap-16 whitespace-nowrap font-mono text-sm text-cream/80 group-hover:[animation-play-state:paused]">
        {Array.from({ length: 8 }).map((_, index) => (
          <p key={index} className="flex items-center gap-3">
            <span className="live-ripple relative h-2.5 w-2.5 rounded-full bg-coral" />
            Claude Code ∙ VS Code ∙ Cursor ∙ Open Code 모두 호환
          </p>
        ))}
      </div>
    </div>
  );
}
