import { AlertTriangle, Info, Lightbulb, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

type CalloutProps = {
  variant: "info" | "tip" | "warn" | "danger";
  title?: string;
  children: ReactNode;
};

const icons = {
  info: Info,
  tip: Lightbulb,
  warn: AlertTriangle,
  danger: ShieldAlert
};

export function Callout({ variant, title, children }: CalloutProps) {
  const Icon = icons[variant];
  return (
    <aside className={`docs-callout docs-callout-${variant}`}>
      <Icon size={20} aria-hidden="true" />
      <div>
        {title ? <strong>{title}</strong> : null}
        <div>{children}</div>
      </div>
    </aside>
  );
}
