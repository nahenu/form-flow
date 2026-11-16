import Link from "next/link";
import { ArrowRight, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { LiveFormDemo } from "@/components/marketing/live-form-demo";
import { FunnelChart } from "@/components/marketing/funnel-story";
import { EmbedSnippet } from "@/components/marketing/embed-snippet";
import { site } from "@/lib/site";

const features = [
  {
    title: "Build",
    body: "Drag fields into place and split them into steps. Validation, required rules and helper text without writing code.",
  },
  {
    title: "Branch",
    body: "Show the next question based on the last answer. People only see what applies to them.",
  },
  {
    title: "Measure",
    body: "Views, completions and time spent on every step. The traffic source is captured on first touch, so you know which campaign brought each lead.",
  },
  {
    title: "Embed",
    body: "One script tag on any site. It loads after your page does and keeps its CSS away from yours.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl gap-16 px-5 pb-24 pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-20 lg:pt-24">
          <div>
            <Reveal>
              <span className="eyebrow">Form builder · funnel analytics</span>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="mt-6 font-display text-[clamp(3.4rem,8.5vw,6.75rem)]">
                Forms people
                <br />
                actually <em className="text-brand">finish</em>.
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-7 max-w-md text-lg leading-relaxed text-muted-foreground">
                Build multi-step forms, branch on answers, and see the exact step where people give up, so you can fix
                it the same day.
              </p>
            </Reveal>
            <Reveal delay={0.24} className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Button asChild className="h-11 rounded-md px-5 text-[0.95rem]">
                <Link href="/dashboard">
                  Start building <ArrowRight />
                </Link>
              </Button>
              <a href="#demo" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground lg:hidden">
                Try the live form <ArrowDown className="size-3.5" />
              </a>
              <span className="hidden text-sm text-muted-foreground lg:inline">Or fill in the form on the right. It&apos;s real.</span>
            </Reveal>
            <Reveal delay={0.32}>
              <dl className="mt-14 grid max-w-md grid-cols-3 border-t border-rule pt-5 text-sm">
                {[
                  ["Price", "Free in beta"],
                  ["Setup", "No card needed"],
                  ["Code", "Open source"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="eyebrow">{k}</dt>
                    <dd className="mt-1.5">{v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <Reveal delay={0.2} id="demo" className="min-w-0 scroll-mt-24">
            <LiveFormDemo />
          </Reveal>
        </section>

        {/* Why */}
        <section id="funnel" className="scroll-mt-14 border-t border-rule">
          <div className="mx-auto grid max-w-6xl gap-14 px-5 py-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <Reveal inView>
              <span className="eyebrow">Why this exists</span>
              <h2 className="mt-6 font-display text-5xl sm:text-6xl">
                One field was quietly <em className="text-brand">costing</em> us leads.
              </h2>
              <div className="mt-8 max-w-md space-y-4 leading-relaxed text-muted-foreground">
                <p>
                  On a lead form I worked on, the six-digit pincode field was where people gave up. Nobody saw it, because
                  the dashboard only counted total submissions.
                </p>
                <p>
                  Swapping it for a city dropdown brought them back. FormFlow is the tool I wanted at the time: drop-off
                  for every step, out of the box, so the leaky field shows up on day one instead of month three.
                </p>
              </div>
              <p className="mt-8 font-display text-2xl italic">— Arpit</p>
            </Reveal>
            <Reveal inView delay={0.1} className="min-w-0">
              <FunnelChart />
            </Reveal>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-14 border-t border-rule">
          <div className="mx-auto max-w-6xl px-5 py-24">
            <Reveal inView className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <span className="eyebrow">What&apos;s in it</span>
                <h2 className="mt-6 font-display text-5xl sm:text-6xl">Four things, done properly.</h2>
              </div>
              <p className="max-w-xs text-muted-foreground">
                No template marketplace and no forty integrations. Just the parts that decide whether a form gets
                finished.
              </p>
            </Reveal>
            <div className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f, i) => (
                <Reveal inView delay={i * 0.06} key={f.title}>
                  <article className="border-t border-foreground pt-5">
                    <span className="font-display text-4xl italic text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-6 text-lg font-medium tracking-tight">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Embed */}
        <section id="embed" className="scroll-mt-14 border-t border-rule">
          <div className="mx-auto grid max-w-6xl gap-14 px-5 py-24 lg:grid-cols-2 lg:items-center lg:gap-20">
            <Reveal inView>
              <span className="eyebrow">Embed</span>
              <h2 className="mt-6 font-display text-5xl sm:text-6xl">One script tag. Any website.</h2>
              <ul className="mt-8 max-w-md divide-y divide-rule border-y border-rule text-sm">
                {[
                  ["Loads last", "Async, after your content. It never blocks the page from rendering."],
                  ["Stays isolated", "Rendered in a shadow root, so your CSS and FormFlow's never collide."],
                  ["Reports back", "Every step view and submit lands in your funnel within seconds."],
                ].map(([k, v]) => (
                  <li key={k} className="grid grid-cols-[7.5rem_1fr] gap-4 py-4">
                    <span className="font-medium">{k}</span>
                    <span className="text-muted-foreground">{v}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal inView delay={0.1} className="min-w-0">
              <EmbedSnippet />
            </Reveal>
          </div>
        </section>

        {/* Closing */}
        <section className="border-t border-rule">
          <div className="mx-auto max-w-6xl px-5 py-28 text-center">
            <Reveal inView>
              <h2 className="mx-auto max-w-3xl font-display text-[clamp(2.75rem,6vw,5rem)]">
                Find the field that&apos;s <em className="text-brand">losing</em> you people.
              </h2>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Button asChild className="h-11 rounded-md px-5 text-[0.95rem]">
                  <Link href="/dashboard">
                    Start building <ArrowRight />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-11 rounded-md bg-transparent px-5 text-[0.95rem]">
                  <a href={site.repo} target="_blank" rel="noreferrer">
                    Read the source
                  </a>
                </Button>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
