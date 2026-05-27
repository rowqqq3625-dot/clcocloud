/**
 * Minimal Markdown → HTML renderer used by both the admin editor
 * preview and the public /case-studies/[slug] detail page.
 *
 * Supports: headings (#~####), paragraphs, **bold**, *italic*,
 * `inline code`, fenced code blocks, bullet + numbered lists, links.
 *
 * Trust boundary: the input comes from the admin console only. We
 * still HTML-escape every interpolated string defensively so a stored
 * `<script>` never executes when an admin pastes one in.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inline(s: string): string {
  return escapeHtml(s)
    .replace(
      /`([^`]+)`/g,
      '<code class="rounded bg-[var(--coral)]/10 px-1 py-0.5 font-mono text-[0.9em] text-[var(--coral-deep)]">$1</code>'
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-[var(--coral)] underline" target="_blank" rel="noreferrer">$1</a>'
    );
}

export function renderMarkdownLite(input: string): string {
  if (!input) return '<p class="text-secondary/60">(빈 본문)</p>';

  const lines = input.split(/\r?\n/);
  const out: string[] = [];
  let inCode = false;
  let codeBuf: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let listBuf: string[] = [];

  const flushList = () => {
    if (listType && listBuf.length) {
      out.push(
        `<${listType} class="ml-5 list-${listType === "ol" ? "decimal" : "disc"} my-3 space-y-1.5">`
      );
      for (const li of listBuf) out.push(`<li>${li}</li>`);
      out.push(`</${listType}>`);
    }
    listType = null;
    listBuf = [];
  };

  for (const raw of lines) {
    if (raw.startsWith("```")) {
      if (inCode) {
        out.push(
          `<pre class="my-4 overflow-auto rounded-xl bg-primary/95 p-4 font-mono text-[12px] leading-6 text-cream"><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`
        );
        codeBuf = [];
        inCode = false;
      } else {
        flushList();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(raw);
      continue;
    }
    const line = raw.trim();
    if (!line) {
      flushList();
      continue;
    }
    const ul = line.match(/^[-*]\s+(.*)/);
    const ol = line.match(/^\d+\.\s+(.*)/);
    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) {
      flushList();
      const level = h[1].length;
      const sizes = ["", "32px", "26px", "22px", "18px"];
      out.push(
        `<h${level} class="mt-7 font-[680] tracking-[-0.025em] text-primary" style="font-size:${sizes[level]}">${inline(h[2])}</h${level}>`
      );
    } else if (ul) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      listBuf.push(inline(ul[1]));
    } else if (ol) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      listBuf.push(inline(ol[1]));
    } else {
      flushList();
      out.push(`<p class="my-3 leading-[1.85]">${inline(line)}</p>`);
    }
  }
  flushList();
  if (inCode && codeBuf.length) {
    out.push(
      `<pre class="my-4 overflow-auto rounded-xl bg-primary/95 p-4 font-mono text-[12px] leading-6 text-cream"><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`
    );
  }
  return out.join("\n");
}
