import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

const STAGGER = 0.035;

/**
 * Text that rolls letter by letter when its link/button is hovered or focused.
 * Pure CSS (see `.text-roll` in globals.css) so it costs nothing at load.
 */
export function TextRoll({
  children,
  className,
  center = false,
}: {
  children: string;
  className?: string;
  center?: boolean;
}) {
  const letters = children.split("");
  const delayFor = (i: number) =>
    center ? STAGGER * Math.abs(i - (letters.length - 1) / 2) : STAGGER * i;

  const row = (copy: "top" | "bottom") => (
    <span aria-hidden className={cn("block", copy === "bottom" && "absolute inset-0")}>
      {letters.map((l, i) => (
        <span
          key={i}
          data-roll={copy}
          className="inline-block whitespace-pre"
          style={{ "--roll-delay": `${delayFor(i)}s` } as CSSProperties}
        >
          {l}
        </span>
      ))}
    </span>
  );

  return (
    <span className={cn("text-roll relative block overflow-hidden", className)}>
      <span className="sr-only">{children}</span>
      {row("top")}
      {row("bottom")}
    </span>
  );
}

/**
 * Adapted from Skiper 58 (text roll navigation) — https://skiper-ui.com
 * Rewritten from Motion to CSS transitions for performance.
 * Free version: attribution to Skiper UI is required.
 */
