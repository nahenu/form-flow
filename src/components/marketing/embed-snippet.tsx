"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { site } from "@/lib/site";

export function EmbedSnippet() {
  const [copied, setCopied] = useState(false);
  const src = `${site.url}/embed.js`;
  const code = `<div data-formflow="f_8k2m1q"></div>\n<script async src="${src}"></script>`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg bg-[#161513] text-[#ede9e0] shadow-[0_30px_60px_-30px_rgba(22,21,19,0.5)] dark:ring-1 dark:ring-rule">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <span className="font-mono text-[11px] text-white/50">index.html</span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded px-2 py-1 font-mono text-[11px] text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          aria-label="Copy embed code"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-6">
        <code>
          <span className="text-white/35">{"<!-- where the form should appear -->"}</span>
          {"\n"}
          <span className="text-white/60">{"<div "}</span>
          data-formflow=<span className="text-[#ff8a8d]">&quot;f_8k2m1q&quot;</span>
          <span className="text-white/60">{"></div>"}</span>
          {"\n"}
          <span className="text-white/60">{"<script "}</span>
          async src=<span className="text-[#ff8a8d]">&quot;{src}&quot;</span>
          <span className="text-white/60">{"></script>"}</span>
        </code>
      </pre>
    </div>
  );
}
