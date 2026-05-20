"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCommand() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="docs-copy-command">
      <code>{command}</code>
      <button type="button" onClick={copyCommand} aria-label="명령어 복사">
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  );
}
