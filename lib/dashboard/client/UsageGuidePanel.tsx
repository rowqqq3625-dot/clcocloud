'use client';

import React, { useMemo, useState } from 'react';

type GuideOs = 'macos' | 'linux' | 'windows-cmd' | 'windows-powershell';

interface UsageGuidePanelProps {
  apiKey: string;
  open: boolean;
  onClose: () => void;
}

const GUIDE_OPTIONS: Array<{ id: GuideOs; label: string }> = [
  { id: 'macos', label: 'macOS zsh' },
  { id: 'windows-powershell', label: 'Windows PowerShell' },
  { id: 'windows-cmd', label: 'Windows CMD' },
  { id: 'linux', label: 'Linux bash' },
];

export function UsageGuidePanel({ apiKey, open, onClose }: UsageGuidePanelProps) {
  const [selectedOs, setSelectedOs] = useState<GuideOs>('macos');
  const [copied, setCopied] = useState(false);
  
  const displayKey = apiKey.trim() || '여기에_발급받은_API키를_넣어주세요';
  const command = useMemo(() => buildCommand(selectedOs, displayKey), [displayKey, selectedOs]);

  if (!open) {
    return null;
  }

  async function copyCommand(): Promise<void> {
    const copiedToClipboard = await copyText(command);
    if (copiedToClipboard) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  }

  return (
    <div className="aip-guide-backdrop" role="presentation">
      <section className="aip-panel aip-guide-panel" role="dialog" aria-modal="true" aria-labelledby="aip-guide-title">
        <div className="aip-guide-header">
          <div>
            <span className="aip-eyebrow">Setup Guide</span>
            <h2 className="aip-guide-title" id="aip-guide-title">
              사용법 안내
            </h2>
          </div>
          <button className="aip-button aip-guide-close" type="button" onClick={onClose}>
            닫기
          </button>
        </div>

        <p className="aip-guide-copy">사용 중인 운영체제 터미널에 아래 명령을 복사하여 붙여넣으세요.</p>

        <div className="aip-guide-tabs" role="tablist" aria-label="운영체제 선택">
          {GUIDE_OPTIONS.map((option) => (
            <button
              key={option.id}
              className={selectedOs === option.id ? 'aip-guide-tab aip-guide-tab-active' : 'aip-guide-tab'}
              type="button"
              role="tab"
              aria-selected={selectedOs === option.id}
              onClick={() => {
                setSelectedOs(option.id);
                setCopied(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="relative mt-4">
          <pre className="aip-guide-code">
            <code>{command}</code>
          </pre>
          <button 
            className="aip-button aip-button-primary aip-guide-copy-button" 
            type="button" 
            onClick={() => void copyCommand()}
          >
            {copied ? '복사됨' : '복사하기'}
          </button>
        </div>
      </section>
    </div>
  );
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return fallbackCopyText(text);
  } catch {
    return fallbackCopyText(text);
  }
}

function fallbackCopyText(text: string): boolean {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

function buildCommand(os: GuideOs, apiKey: string): string {
  const key = apiKey.trim();

  if (os === 'windows-cmd') {
    return [
      'REG delete HKCU\\Environment /F /V ANTHROPIC_API_KEY 2>nul',
      'setx ANTHROPIC_BASE_URL "https://api-anthropic.com/v1"',
      `setx ANTHROPIC_AUTH_TOKEN "${key}"`,
      'setx CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC "1"',
      'set ANTHROPIC_API_KEY=',
      'call claude /logout',
      'call claude',
    ].join('\n');
  }

  if (os === 'windows-powershell') {
    return [
      '[Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", $null, "User")',
      '[Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", "https://api-anthropic.com/v1", "User")',
      `[Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", "${key}", "User")`,
      '[Environment]::SetEnvironmentVariable("CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC", "1", "User")',
      '$env:ANTHROPIC_API_KEY=""',
      'claude /logout',
      'claude',
    ].join('\n');
  }

  if (os === 'linux') {
    return [
      'sed -i \'/export ANTHROPIC_API_KEY/d\' ~/.bashrc',
      'echo \'export ANTHROPIC_BASE_URL="https://api-anthropic.com/v1"\' >> ~/.bashrc',
      `echo 'export ANTHROPIC_AUTH_TOKEN="${key}"' >> ~/.bashrc`,
      'echo \'export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC="1"\' >> ~/.bashrc',
      'unset ANTHROPIC_API_KEY',
      'source ~/.bashrc',
      'claude /logout',
      'claude',
    ].join('\n');
  }

  return [
    'sed -i \'\' \'/export ANTHROPIC_API_KEY/d\' ~/.zshrc',
    'echo \'export ANTHROPIC_BASE_URL="https://api-anthropic.com/v1"\' >> ~/.zshrc',
    `echo 'export ANTHROPIC_AUTH_TOKEN="${key}"' >> ~/.zshrc`,
    'echo \'export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC="1"\' >> ~/.zshrc',
    'unset ANTHROPIC_API_KEY',
    'source ~/.zshrc',
    'claude /logout',
    'claude',
  ].join('\n');
}
