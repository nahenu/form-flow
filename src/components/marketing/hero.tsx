import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { ProductWindow } from "./product-window";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Background: faint grid that fades out, plus two soft brand glows behind the window */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#e2e8f5_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f5_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_65%_50%_at_50%_0%,black_30%,transparent_100%)]"
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-[30rem] -z-10 h-[34rem] w-[min(70rem,140vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(9,49,141,0.18),transparent)]"
      />
      <div
        aria-hidden
        className="absolute left-[60%] top-[34rem] -z-10 h-[24rem] w-[40rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(253,145,204,0.35),transparent)]"
      />

      <div className="mx-auto max-w-6xl px-5 pb-24 pt-16 text-center sm:pt-24">
        <Reveal>
          <a
            href="#why"
            className="group inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-white py-1 pl-1 pr-3 text-[13px] text-muted-foreground shadow-sm transition-colors hover:border-primary/30 sm:text-sm"
          >
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-[#b8326f]">New</span>
            <span className="min-[360px]:hidden">Drop-off analytics</span>
            <span className="hidden min-[360px]:inline">Step-by-step drop-off analytics</span>
            <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </a>
        </Reveal>

        {/* Headline and intro paint immediately: they're the LCP candidates. */}
        <div>
          <h1 className="mx-auto mt-7 max-w-4xl font-display text-[clamp(2.75rem,7vw,5.25rem)] text-foreground">
            Forms people actually{" "}
            <span className="relative inline-block whitespace-nowrap text-primary">
              finish.
              <svg
                aria-hidden
                viewBox="0 0 220 16"
                preserveAspectRatio="none"
                className="absolute -bottom-[0.12em] left-0 h-[0.22em] w-full overflow-visible"
              >
                <path
                  d="M3 11 C 55 3, 150 2, 217 9"
                  fill="none"
                  stroke="#fd91cc"
                  strokeWidth="7"
                  strokeLinecap="round"
                  className="draw-in"
                />
              </svg>
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Build multi-step forms, branch on answers, and see the exact step where people give up, so you can fix it the
            same day.
          </p>
        </div>

        <Reveal delay={0.18} className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/sign-up"
            className="group inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-[0.95rem] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(9,49,141,0.6)] transition-[background-color,transform] hover:bg-[#0b3aa6] active:scale-[0.98]"
          >
            Start building, it&apos;s free
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#demo"
            className="inline-flex h-12 items-center rounded-full border border-border bg-white px-6 text-[0.95rem] font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-muted"
          >
            Try the live demo
          </a>
        </Reveal>

        <Reveal delay={0.22}>
          <p className="mt-5 text-sm text-muted-foreground">No card needed · Open source · Embed anywhere</p>
        </Reveal>

        <Reveal delay={0.3} id="demo" className="mt-16 scroll-mt-24 sm:mt-20">
          <ProductWindow />
        </Reveal>
      </div>
    </section>
  );
}
