import type { ComponentProps, CSSProperties } from "react";
import { cn } from "@/lib/utils";

type RevealProps = ComponentProps<"div"> & {
  /** Seconds to wait before the on-load reveal starts. */
  delay?: number;
  /** Reveal as the element scrolls into view instead of on load. */
  inView?: boolean;
};

/**
 * Fade-and-rise entrance done entirely in CSS (see globals.css), so it costs
 * no JavaScript and never delays hydration. Scroll reveals use scroll-driven
 * animations where supported; elsewhere the content is simply visible.
 */
export function Reveal({ delay = 0, inView = false, className, style, ...props }: RevealProps) {
  return (
    <div
      className={cn(inView ? "reveal-view" : "reveal-load", className)}
      style={{ ...style, "--reveal-delay": `${delay}s` } as CSSProperties}
      {...props}
    />
  );
}
