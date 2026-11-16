import Link from "next/link";
import { Logo } from "@/components/marketing/logo";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col bg-muted/40 px-5">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center">
        <Logo className="text-foreground" />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center pb-24 text-center">
        <p className="rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-[#b8326f]">404</p>
        <h1 className="mt-5 font-display text-4xl text-foreground sm:text-5xl">This page isn&apos;t here.</h1>
        <p className="mt-3 max-w-sm text-muted-foreground">
          The link may be wrong, the form may have been deleted, or it belongs to another account.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard" className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-white hover:bg-[#0b3aa6]">
            Go to your forms
          </Link>
          <Link href="/" className="inline-flex h-11 items-center rounded-full border border-border bg-white px-5 text-sm font-semibold text-foreground hover:bg-muted">
            FormFlow home
          </Link>
        </div>
      </div>
    </main>
  );
}
