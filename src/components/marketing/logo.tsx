import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-7 place-items-center rounded-[9px]",
        inverted ? "bg-white text-primary" : "bg-primary text-white",
        className,
      )}
    >
      <svg viewBox="0 0 16 16" fill="none" className="size-4">
        <path d="M3 4.5h10M3 8h6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="11.75" cy="11.5" r="1.9" className="fill-brand" />
        <path d="M3 11.5h4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2 font-display text-lg !tracking-tight", className)}
    >
      <LogoMark inverted={inverted} />
      FormFlow
    </Link>
  );
}
