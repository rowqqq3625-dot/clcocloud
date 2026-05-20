export const AGENT_INSTALL_COMMAND =
  "Install and configure anthropic model by following the instructions here: https://github.com/clcocloud/clcocloud.md";

export const LINUX_CODE = `sed -i '/export ANTHROPIC_API_KEY/d' ~/.bashrc
echo 'export ANTHROPIC_BASE_URL="https://api-anthropic.com/v1"' >> ~/.bashrc
echo 'export ANTHROPIC_AUTH_TOKEN="여기에_발급받은_API키를 넣어주세요."' >> ~/.bashrc
echo 'export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC="1"' >> ~/.bashrc
unset ANTHROPIC_API_KEY
source ~/.bashrc
claude /logout`;

export const MACOS_CODE = `sed -i '' '/export ANTHROPIC_API_KEY/d' ~/.zshrc
echo 'export ANTHROPIC_BASE_URL="https://api-anthropic.com/v1"' >> ~/.zshrc
echo 'export ANTHROPIC_AUTH_TOKEN="여기에_발급받은_API키를 넣어주세요."' >> ~/.zshrc
echo 'export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC="1"' >> ~/.zshrc
unset ANTHROPIC_API_KEY
source ~/.zshrc
claude /logout`;

export const PS_CODE = `[Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", $null, "User")
[Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", "https://api-anthropic.com/v1", "User")
[Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", "여기에_발급받은_API키를 넣어주세요.", "User")
[Environment]::SetEnvironmentVariable("CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC", "1", "User")
$env:ANTHROPIC_API_KEY=""
claude /logout`;

export const CMD_CODE = `REG delete HKCU\\Environment /F /V ANTHROPIC_API_KEY 2>nul
setx ANTHROPIC_BASE_URL "https://api-anthropic.com/v1"
setx ANTHROPIC_AUTH_TOKEN "여기에_발급받은_API키를 넣어주세요."
setx CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC "1"
set ANTHROPIC_API_KEY=
claude /logout`;

export const CLAUDE_CODE_INSTALL = "npm install -g @anthropic-ai/claude-code";

export const OS_TABS = [
  {
    id: "macos",
    label: "macOS",
    icon: "apple",
    code: MACOS_CODE,
    lang: "bash",
    filename: "~/.zshrc"
  },
  {
    id: "ps",
    label: "Windows PowerShell",
    icon: "square-terminal",
    code: PS_CODE,
    lang: "powershell",
    filename: "PowerShell"
  },
  {
    id: "cmd",
    label: "Windows CMD",
    icon: "monitor",
    code: CMD_CODE,
    lang: "batch",
    filename: "Command Prompt"
  },
  {
    id: "linux",
    label: "Linux",
    icon: "terminal",
    code: LINUX_CODE,
    lang: "bash",
    filename: "~/.bashrc"
  }
] as const;

export const CURSOR_CONFIG = `{
  "anthropic.baseUrl": "https://api-anthropic.com/v1",
  "anthropic.apiKey": "여기에_발급받은_API키를 넣어주세요."
}`;

export const VSCODE_CONFIG = `{
  "anthropic.baseUrl": "https://api-anthropic.com/v1",
  "anthropic.authToken": "여기에_발급받은_API키를 넣어주세요.",
  "anthropic.model": "claude-sonnet-4-6"
}`;

export const OPENCODE_CONFIG = `{
  "provider": {
    "anthropic": {
      "api": "https://api-anthropic.com/v1",
      "key": "여기에_발급받은_API키를 넣어주세요."
    }
  },
  "model": "anthropic/claude-sonnet-4-6"
}`;

export const N8N_CONFIG = `ANTHROPIC_BASE_URL=https://api-anthropic.com/v1
ANTHROPIC_AUTH_TOKEN=여기에_발급받은_API키를 넣어주세요.`;

export const HERMES_AGENT_CONFIG = `endpoint: https://api-anthropic.com/v1
auth_token: 여기에_발급받은_API키를 넣어주세요.
model: claude-sonnet-4-6`;
