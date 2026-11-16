import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Hero } from "@/components/marketing/hero";
import { FieldMarquee } from "@/components/marketing/field-marquee";
import { FunnelChart } from "@/components/marketing/funnel-story";
import { Features } from "@/components/marketing/features";
import { EmbedSection } from "@/components/marketing/embed-section";
import { site } from "@/lib/site";

const faqs = [
  {
    question: "How is this different from Google Forms or Typeform?",
    answer:
      "Those tell you how many people submitted. FormFlow records every step, so you can also see where everyone else went, and how long they hesitated before leaving.",
  },
  {
    question: "Is it free?",
    answer: "Yes, while it's in beta. No card, no trial timer.",
  },
  {
    question: "Will the embed slow my site down?",
    answer:
      "No. The script loads async after your page has rendered, and the form lives in a shadow root, so it can't touch your styles or block your content.",
  },
  {
    question: "Can different people see different questions?",
    answer:
      "Yes. Every question can branch on an earlier answer. Someone in Bengaluru can be asked to pick a studio while everyone else gets a callback option.",
  },
  {
    question: "Can I see the code?",
    answer: (
      <>
        All of it.{" "}
        <a href={site.repo} target="_blank" rel="noreferrer" className="font-semibold text-primary underline decoration-brand decoration-2 underline-offset-4">
          FormFlow is open source on GitHub
        </a>
        , built with Next.js, TypeScript and Tailwind.
      </>
    ),
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <FieldMarquee />

        {/* Why */}
        <section id="why" className="scroll-mt-24">
          <div className="mx-auto max-w-6xl px-5 pt-24 sm:pt-32">
            <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">
              <Reveal inView>
                <span className="kicker">Why this exists</span>
                <h2 className="mt-5 font-display text-4xl text-primary sm:text-5xl">
                  The pincode field was quietly costing us leads.
                </h2>
                <div className="mt-6 max-w-md space-y-4 text-lg leading-relaxed text-muted-foreground">
                  <p>
                    On a lead form I worked on, people gave up at the six-digit pincode field. Nobody noticed, because the
                    dashboard only counted total submissions.
                  </p>
                  <p>
                    Swapping it for a city dropdown brought them back. FormFlow is the tool I wanted then: drop-off for
                    every step, out of the box.
                  </p>
                </div>
                <p className="mt-6 font-display text-xl text-primary">— Arpit</p>
              </Reveal>
              <Reveal inView delay={0.1} className="min-w-0">
                <FunnelChart />
              </Reveal>
            </div>
          </div>
        </section>

        <Features />
        <EmbedSection />

        {/* FAQ */}
        <section id="faq" className="scroll-mt-24">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 sm:py-32 lg:grid-cols-[0.8fr_1.2fr]">
            <Reveal inView>
              <span className="kicker">FAQ</span>
              <h2 className="mt-5 font-display text-5xl text-primary">Fair questions.</h2>
              <p className="mt-5 max-w-xs text-muted-foreground">
                Something else?{" "}
                <a href={`${site.repo}/issues`} target="_blank" rel="noreferrer" className="font-semibold text-primary underline decoration-brand decoration-2 underline-offset-4">
                  Open an issue
                </a>
                .
              </p>
            </Reveal>
            <Reveal inView delay={0.1}>
              <FaqAccordion items={faqs} />
            </Reveal>
          </div>
        </section>

        {/* Closing */}
        <section className="px-3 sm:px-5">
          <Reveal inView className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-primary px-6 py-20 text-center text-white sm:py-24">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_70%_at_50%_100%,black,transparent)]"
            />
            <div aria-hidden className="absolute -bottom-72 left-1/2 -z-10 size-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(253,145,204,0.5),transparent)]" />
            <h2 className="mx-auto max-w-3xl font-display text-[clamp(2.25rem,5.5vw,4rem)]">
              Find the field that&apos;s costing you leads.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-lg text-white/70">
              Build your first form in a few minutes. Watch the funnel fill up the same day.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-brand px-6 font-semibold text-primary transition-[background-color,transform] hover:bg-[#ff9fd3] active:scale-[0.98]"
              >
                Start building, it&apos;s free
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href={site.repo}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center rounded-full border border-white/25 px-6 font-semibold transition-colors hover:bg-white/10"
              >
                View the source
              </a>
            </div>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
