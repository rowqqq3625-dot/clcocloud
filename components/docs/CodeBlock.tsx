"use client";

import { Check, Copy } from "lucide-react";
import { useMemo, useState } from "react";

type CodeBlockProps = {
  code: string;
  lang: string;
  filename?: string;
  highlightLines?: number[];
  showLineNumbers?: boolean;
};

const KEYWORDS = /\b(export|echo|sed|setx|REG|unset|set|source|claude|null|Environment|SetEnvironmentVariable)\b/g;
const ENV_NAMES =
  /\b(ANTHROPIC_BASE_URL|ANTHROPIC_AUTH_TOKEN|CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC|ANTHROPIC_API_KEY)\b/g;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlight(line: string) {
  return escapeHtml(line)
    .replace(/(#.*)$/g, '<span class="docs-token-comment">$1</span>')
    .replace(/(".*?"|'.*?')/g, '<span class="docs-token-string">$1</span>')
    .replace(ENV_NAMES, '<span class="docs-token-env">$1</span>')
    .replace(KEYWORDS, '<span class="docs-token-keyword">$1</span>')
    .replace(/(\$env:?|~|%|&amp;)/g, '<span class="docs-token-variable">$1</span>');
}

export function CodeBlock({
  code,
  lang,
  filename,
  highlightLines = [],
  showLineNumbers = false
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const lines = useMemo(() => code.split("\n"), [code]);

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <figure className="docs-code-block group">
      <figcaption className="docs-code-topbar">
        <div className="docs-code-file">
          <span className="docs-code-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          {filename ? <span>{filename}</span> : null}
        </div>
        <div className="docs-code-actions">
          <span className="docs-code-lang">{lang}</span>
          <button type="button" onClick={copyCode} aria-label="코드 복사" className="docs-copy-button">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? <span className="docs-copy-tooltip">복사됨</span> : null}
          </button>
        </div>
      </figcaption>
      <pre>
        <code>
          {lines.map((line, index) => {
            const lineNumber = index + 1;
            const active = highlightLines.includes(lineNumber);
            return (
              <span key={`${lineNumber}-${line}`} className={`docs-code-line ${active ? "is-highlighted" : ""}`}>
                {showLineNumbers ? <span className="docs-line-number">{lineNumber}</span> : null}
                <span dangerouslySetInnerHTML={{ __html: highlight(line) || " " }} />
              </span>
            );
          })}
        </code>
      </pre>
    </figure>
  );
}
