"use client";

import { motion } from "motion/react";

import { cn } from "@/lib/utils";

const STAGGER = 0.035;

/**
 * Text that rolls letter by letter on hover. The parent can drive it by
 * setting `whileHover="hovered"` itself, or the span handles hover on its own.
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

  return (
    <motion.span
      initial="initial"
      whileHover="hovered"
      className={cn("relative block overflow-hidden", className)}
    >
      <span className="sr-only">{children}</span>
      <span aria-hidden className="block">
        {letters.map((l, i) => (
          <motion.span
            key={i}
            variants={{ initial: { y: 0 }, hovered: { y: "-100%" } }}
            transition={{ ease: "easeInOut", delay: delayFor(i) }}
            className="inline-block whitespace-pre"
          >
            {l}
          </motion.span>
        ))}
      </span>
      <span aria-hidden className="absolute inset-0 block">
        {letters.map((l, i) => (
          <motion.span
            key={i}
            variants={{ initial: { y: "100%" }, hovered: { y: 0 } }}
            transition={{ ease: "easeInOut", delay: delayFor(i) }}
            className="inline-block whitespace-pre"
          >
            {l}
          </motion.span>
        ))}
      </span>
    </motion.span>
  );
}

/**
 * Adapted from Skiper 58 (text roll navigation) — https://skiper-ui.com
 * Free version: attribution to Skiper UI is required.
 */
