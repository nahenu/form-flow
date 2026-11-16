import Link from "next/link";
import { Star } from "lucide-react";
import { TextRoll } from "@/components/ui/skiper-ui/skiper58";
import { site } from "@/lib/site";
import { Logo } from "./logo";

const nav = [
  { href: "#why", label: "Why" },
  { href: "#features", label: "Features" },
  { href: "#embed", label: "Embed" },
  { href: "#faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo className="text-foreground" />
        <nav aria-label="Main" className="hidden items-center gap-8 text-sm font-medium md:flex">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="text-muted-foreground transition-colors hover:text-foreground">
              <TextRoll className="leading-5">{item.label}</TextRoll>
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <a
            href={site.repo}
            target="_blank"
            rel="noreferrer"
            className="hidden h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground lg:inline-flex"
          >
            <Star className="size-3.5" /> Star on GitHub
          </a>
          <Link
            href="/sign-in"
            className="hidden h-9 items-center rounded-full px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0b3aa6]"
          >
            Start building
          </Link>
        </div>
      </div>
    </header>
  );
}
