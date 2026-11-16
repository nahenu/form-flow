import Link from "next/link";
import { Logo } from "@/components/marketing/logo";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <Logo className="text-foreground" />
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-[#b8326f]">Beta</span>
        </div>
        <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Back to site
        </Link>
      </div>
    </header>
  );
}
