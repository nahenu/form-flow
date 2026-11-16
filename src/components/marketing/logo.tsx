import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className={cn("size-5", className)}
    >
      <rect x="1.5" y="1.5" width="17" height="17" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 7h9M5.5 10.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="11.5" y="12.75" width="3.5" height="3" rx="0.75" className="fill-brand" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2 text-[0.95rem] font-medium tracking-tight", className)}
    >
      <LogoMark />
      FormFlow
    </Link>
  );
}
