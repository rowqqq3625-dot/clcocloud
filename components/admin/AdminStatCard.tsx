type Props = {
  label: string;
  value: string;
  hint?: string;
};

export function AdminStatCard({ label, value, hint }: Props) {
  return (
    <div className="rounded-2xl border border-cream/10 bg-[#1F1E1D]/80 p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/40">{label}</p>
      <p className="mt-2 text-2xl font-bold text-cream">{value}</p>
      {hint ? <p className="mt-1 text-xs text-cream/50">{hint}</p> : null}
    </div>
  );
}
