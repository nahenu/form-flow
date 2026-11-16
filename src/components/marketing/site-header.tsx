import Link from "next/link";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";
import { Logo } from "./logo";

const nav = [
  { href: "#funnel", label: "Why" },
  { href: "#features", label: "Features" },
  { href: "#embed", label: "Embed" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-rule/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="flex items-center gap-1 text-sm">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hidden rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              {item.label}
            </a>
          ))}
          <a
            href={site.repo}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            GitHub
          </a>
          <Button asChild className="ml-2 h-8 rounded-md px-3.5">
            <Link href="/dashboard">Start building</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
