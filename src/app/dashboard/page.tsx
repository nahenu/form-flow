import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/marketing/logo";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Builder" };

export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5">
      <div className="flex h-14 items-center">
        <Logo />
      </div>
      <div className="flex flex-1 flex-col justify-center py-24">
        <span className="eyebrow">Builder · in progress</span>
        <h1 className="mt-6 max-w-2xl font-display text-[clamp(3rem,7vw,5.5rem)]">
          The builder is on the <em className="text-brand">drawing board</em>.
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
          Drag-and-drop editing, steps and branching are being built right now. You can follow along commit by commit.
        </p>
        <div className="mt-10 flex gap-6 text-sm">
          <Link href="/" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Back home
          </Link>
          <a href={site.repo} target="_blank" rel="noreferrer" className="underline decoration-rule underline-offset-4 hover:decoration-foreground">
            Watch it on GitHub
          </a>
        </div>
      </div>
    </main>
  );
}
