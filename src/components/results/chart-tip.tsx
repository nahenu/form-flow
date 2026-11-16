import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A focusable chart mark with a hover/focus tooltip, in pure CSS. The hit area
 * is the whole wrapper (bigger than the mark) and the same text is the mark's
 * accessible name, so keyboard and screen-reader users get the same detail.
 */
export function ChartTip({
  label,
  children,
  className,
  side = "top",
}: {
  label: string;
  children: ReactNode;
  className?: string;
  side?: "top" | "right";
}) {
  return (
    <div tabIndex={0} aria-label={label} className={cn("group/tip relative outline-none", className)}>
      {children}
      <div
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-20 hidden w-max max-w-64 rounded-lg bg-foreground px-2.5 py-1.5 text-xs leading-snug text-white shadow-lg group-hover/tip:block group-focus-visible/tip:block",
          side === "top" ? "bottom-full left-1/2 mb-2 -translate-x-1/2" : "left-full top-1/2 ml-2 -translate-y-1/2",
        )}
      >
        {label}
      </div>
    </div>
  );
}
