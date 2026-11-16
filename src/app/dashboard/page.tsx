import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/marketing/logo";
import { PerspectiveGrid } from "@/components/ui/perspective-grid";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Builder" };

export default function DashboardPage() {
  return (
    <main className="relative isolate flex flex-1 flex-col overflow-hidden bg-primary text-white">
      <PerspectiveGrid
        className="absolute inset-0 -z-10"
        gridSize={30}
        fadeColor="#09318d"
        tileClassName="border-white/[0.07] hover:bg-brand/70"
      />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5">
        <div className="flex h-20 items-center">
          <Logo inverted />
        </div>
        <div className="pointer-events-none flex flex-1 flex-col justify-center py-20 [&_a]:pointer-events-auto">
          <span className="kicker w-fit bg-white/10 text-white">Builder · in progress</span>
          <h1 className="mt-6 max-w-3xl font-display text-[clamp(3rem,7vw,5.5rem)]">
            The builder is <span className="text-brand">being built.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-white/70">
            Drag-and-drop editing, steps and branching are landing next. You can follow along commit by commit.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href={site.repo}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center rounded-full bg-brand px-6 font-bold text-primary"
            >
              Watch it on GitHub
            </a>
            <Link
              href="/"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-white/25 px-6 font-semibold hover:bg-white/10"
            >
              <ArrowLeft className="size-4" /> Back home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
