"use client";

import { forwardRef, useRef, useState, type ReactNode } from "react";
import { BarChart3, Check, Copy, FileSpreadsheet, Globe, Inbox, LayoutTemplate, ShoppingBag } from "lucide-react";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { LogoMark } from "./logo";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

const Node = forwardRef<HTMLDivElement, { children: ReactNode; label: string; className?: string }>(
  ({ children, label, className }, ref) => (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={ref}
        className={cn(
          "z-10 grid size-14 place-items-center rounded-2xl border border-white/15 bg-[#0d3aa3] text-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]",
          className,
        )}
      >
        {children}
      </div>
      <span className="text-xs font-medium text-white/60">{label}</span>
    </div>
  ),
);
Node.displayName = "Node";

function FlowDiagram() {
  const container = useRef<HTMLDivElement>(null);
  const site1 = useRef<HTMLDivElement>(null);
  const site2 = useRef<HTMLDivElement>(null);
  const site3 = useRef<HTMLDivElement>(null);
  const hub = useRef<HTMLDivElement>(null);
  const out1 = useRef<HTMLDivElement>(null);
  const out2 = useRef<HTMLDivElement>(null);
  const out3 = useRef<HTMLDivElement>(null);

  const beam = { pathColor: "#ffffff", pathOpacity: 0.12, gradientStartColor: "#fd91cc", gradientStopColor: "#ffffff" };

  return (
    <div ref={container} className="relative flex items-center justify-between gap-4 py-4">
      <div className="flex flex-col gap-6">
        <Node ref={site1} label="Your site"><Globe className="size-6" /></Node>
        <Node ref={site2} label="Landing page"><LayoutTemplate className="size-6" /></Node>
        <Node ref={site3} label="Store"><ShoppingBag className="size-6" /></Node>
      </div>
      <Node ref={hub} label="FormFlow" className="size-20 rounded-3xl border-0 bg-white">
        <LogoMark className="size-11 rounded-xl [&_svg]:size-6" />
      </Node>
      <div className="flex flex-col gap-6">
        <Node ref={out1} label="Funnel"><BarChart3 className="size-6" /></Node>
        <Node ref={out2} label="Leads inbox"><Inbox className="size-6" /></Node>
        <Node ref={out3} label="CSV export"><FileSpreadsheet className="size-6" /></Node>
      </div>

      <AnimatedBeam containerRef={container} fromRef={site1} toRef={hub} curvature={-40} {...beam} />
      <AnimatedBeam containerRef={container} fromRef={site2} toRef={hub} {...beam} delay={0.4} />
      <AnimatedBeam containerRef={container} fromRef={site3} toRef={hub} curvature={40} {...beam} delay={0.8} />
      <AnimatedBeam containerRef={container} fromRef={hub} toRef={out1} curvature={-40} {...beam} delay={1.2} />
      <AnimatedBeam containerRef={container} fromRef={hub} toRef={out2} {...beam} delay={1.6} />
      <AnimatedBeam containerRef={container} fromRef={hub} toRef={out3} curvature={40} {...beam} delay={2} />
    </div>
  );
}

function Snippet() {
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
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#061f5c]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <span className="font-mono text-[11px] text-white/50">index.html</span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/20"
          aria-label="Copy embed code"
        >
          {copied ? <Check className="size-3.5 text-brand" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-6 text-white/85">
        <code>
          <span className="text-white/40">{"<!-- where the form should appear -->"}</span>
          {"\n"}
          <span className="text-white/50">{"<div "}</span>data-formflow=<span className="text-brand">&quot;f_8k2m1q&quot;</span>
          <span className="text-white/50">{"></div>"}</span>
          {"\n"}
          <span className="text-white/50">{"<script "}</span>async src=<span className="text-brand">&quot;{src}&quot;</span>
          <span className="text-white/50">{"></script>"}</span>
        </code>
      </pre>
    </div>
  );
}

export function EmbedSection() {
  return (
    <section id="embed" className="scroll-mt-24 px-3 sm:px-5">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-primary text-white">
        <div className="mx-auto grid max-w-6xl gap-14 px-5 py-20 sm:px-10 sm:py-24 lg:grid-cols-2 lg:items-center">
          <div className="min-w-0">
            <span className="kicker bg-white/10 text-white">Embed</span>
            <h2 className="mt-5 font-display text-5xl sm:text-6xl">
              One script tag.
              <br />
              <span className="text-brand">Any website.</span>
            </h2>
            <ul className="mt-8 space-y-4">
              {[
                ["Loads last", "Async, after your content. It never blocks the page from rendering."],
                ["Stays isolated", "Rendered in a shadow root, so your CSS and FormFlow's never collide."],
                ["Reports back", "Every step view and submit lands in your funnel within seconds."],
              ].map(([k, v]) => (
                <li key={k} className="flex gap-3">
                  <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-brand text-primary">
                    <Check className="size-3" strokeWidth={3.5} />
                  </span>
                  <span className="text-white/70">
                    <strong className="font-semibold text-white">{k}.</strong> {v}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0 space-y-8">
            <FlowDiagram />
            <Snippet />
          </div>
        </div>
      </div>
    </section>
  );
}
