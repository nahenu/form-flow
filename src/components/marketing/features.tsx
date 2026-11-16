import { GripVertical, Type, AtSign, MapPin } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";

function BuildVisual() {
  const rows = [
    { icon: Type, label: "Full name" },
    { icon: AtSign, label: "Email" },
  ];
  return (
    <div className="relative mt-8 space-y-2.5">
      {rows.map(({ icon: Icon, label }) => (
        <div key={label} className="flex items-center gap-3 rounded-xl bg-white/10 px-3.5 py-3 text-sm">
          <GripVertical className="size-4 text-white/40" />
          <Icon className="size-4 text-white/70" />
          {label}
        </div>
      ))}
      <div className="flex translate-x-3 -rotate-2 items-center gap-3 rounded-xl bg-white px-3.5 py-3 text-sm font-semibold text-primary shadow-[0_18px_30px_-12px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:translate-x-0 group-hover:rotate-0">
        <GripVertical className="size-4 text-brand" />
        <MapPin className="size-4" />
        City
        <span className="ml-auto rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold">dragging</span>
      </div>
    </div>
  );
}

function BranchVisual() {
  return (
    <div className="mt-8 flex flex-col items-start gap-2 text-sm font-semibold">
      <span className="rounded-xl bg-primary px-3.5 py-2.5 text-white">City?</span>
      <div className="ml-5 flex flex-col gap-2 border-l-2 border-dashed border-primary/40 pl-5">
        <span className="relative rounded-xl bg-white px-3.5 py-2.5 text-primary before:absolute before:-left-5 before:top-1/2 before:h-0.5 before:w-5 before:bg-primary/40">
          Bengaluru → Pick a studio
        </span>
        <span className="relative rounded-xl bg-white/60 px-3.5 py-2.5 text-primary/70 before:absolute before:-left-5 before:top-1/2 before:h-0.5 before:w-5 before:bg-primary/40">
          Elsewhere → Book a call
        </span>
      </div>
    </div>
  );
}

function MeasureVisual() {
  const bars = [100, 82, 74, 41, 36];
  return (
    <div className="mt-8">
      <div className="flex h-28 items-end gap-2">
        {bars.map((h, i) => (
          <div
            key={i}
            className={i === 3 ? "flex-1 rounded-lg bg-brand" : "flex-1 rounded-lg bg-primary/85"}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <p className="mt-3 text-xs font-semibold text-[#d6337f]">Step 4 loses 45% of people</p>
    </div>
  );
}

const cards = [
  {
    n: "01",
    title: "Build",
    body: "Drag fields into place and split them into steps. Validation and required rules, no code.",
    className: "bg-primary text-white lg:col-span-2",
    muted: "text-white/70",
    visual: <BuildVisual />,
  },
  {
    n: "02",
    title: "Branch",
    body: "Show the next question based on the last answer. People only see what applies to them.",
    className: "bg-brand-soft text-primary",
    muted: "text-primary/70",
    visual: <BranchVisual />,
  },
  {
    n: "03",
    title: "Measure",
    body: "Views, completions and time on every step, plus the campaign that brought each lead.",
    className: "border border-border bg-white text-primary",
    muted: "text-muted-foreground",
    visual: <MeasureVisual />,
  },
  {
    n: "04",
    title: "Embed",
    body: "One script tag on any site. Loads after your page and keeps its CSS to itself.",
    className: "bg-secondary text-primary lg:col-span-2",
    muted: "text-muted-foreground",
    visual: (
      <div className="mt-8 rounded-xl bg-[#061f5c] p-4 font-mono text-[13px] text-white/80 [overflow-wrap:anywhere]">
        <span className="text-white/65">{"<script "}</span>async src=<span className="text-brand">&quot;…/embed.js&quot;</span>
        <span className="text-white/65">{"></script>"}</span>
      </div>
    ),
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:py-32">
        <Reveal inView className="max-w-2xl">
          <span className="kicker">What&apos;s inside</span>
          <h2 className="mt-5 font-display text-5xl text-primary sm:text-6xl">Four things, done properly.</h2>
          <p className="mt-5 text-lg text-muted-foreground">
            No template marketplace, no forty integrations. Just the parts that decide whether a form gets finished.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal inView delay={i * 0.06} key={c.title} className={`group overflow-hidden rounded-[1.75rem] p-7 sm:p-8 ${c.className}`}>
              <article>
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-3xl">{c.title}</h3>
                  <span className={`font-display text-sm font-medium tabular-nums ${c.muted}`}>{c.n}</span>
                </div>
                <p className={`mt-3 max-w-md leading-relaxed ${c.muted}`}>{c.body}</p>
                {c.visual}
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
