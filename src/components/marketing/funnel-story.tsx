"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { NumberTicker } from "@/components/ui/number-ticker";
import { cn } from "@/lib/utils";

type Row = { label: string; value: number; culprit?: boolean };

const FUNNELS: Record<"before" | "after", Row[]> = {
  before: [
    { label: "Opened form", value: 100 },
    { label: "Name", value: 84 },
    { label: "Phone", value: 76 },
    { label: "Pincode", value: 45, culprit: true },
    { label: "OTP verified", value: 36 },
    { label: "Submitted", value: 33 },
  ],
  after: [
    { label: "Opened form", value: 100 },
    { label: "Name", value: 84 },
    { label: "Phone", value: 76 },
    { label: "City", value: 71, culprit: true },
    { label: "OTP verified", value: 58 },
    { label: "Submitted", value: 54 },
  ],
};

const ease = [0.22, 1, 0.36, 1] as const;

export function FunnelChart() {
  const [view, setView] = useState<"before" | "after">("before");
  const listRef = useRef<HTMLOListElement>(null);
  const inView = useInView(listRef, { once: true, margin: "-60px" });
  const rows = FUNNELS[view];
  const completion = rows[rows.length - 1].value;

  return (
    <div className="rounded-lg border border-rule bg-card p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="eyebrow">Example funnel · illustrative data</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-6xl">
              <NumberTicker value={completion} startValue={33} className="tracking-tight text-foreground dark:text-foreground" />%
            </span>
            <span className="text-sm text-muted-foreground">finish the form</span>
          </div>
        </div>

        <div role="tablist" aria-label="Funnel version" className="relative flex rounded-md border border-rule p-0.5 text-xs">
          {(["before", "after"] as const).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={cn(
                "relative z-10 rounded-[4px] px-3 py-1.5 capitalize transition-colors",
                view === v ? "text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {view === v && (
                <motion.span
                  layoutId="funnel-tab"
                  className="absolute inset-0 -z-10 rounded-[4px] bg-foreground"
                  transition={{ duration: 0.35, ease }}
                />
              )}
              {v}
            </button>
          ))}
        </div>
      </div>

      <ol ref={listRef} className="mt-8 space-y-2">
        {rows.map((row, i) => {
          const prev = rows[i - 1]?.value;
          const drop = prev ? Math.round(((prev - row.value) / prev) * 100) : null;
          const highlight = row.culprit && view === "before";
          return (
            <li
              key={i}
              className="grid grid-cols-[5.25rem_1fr_2.5rem_2rem] items-center gap-2.5 text-sm sm:grid-cols-[6.5rem_1fr_2.75rem_2.25rem] sm:gap-3"
            >
              <span className={cn("truncate", highlight ? "text-brand" : "text-muted-foreground")}>{row.label}</span>
              <span className="relative h-7 overflow-hidden rounded-[3px] bg-muted/70">
                <motion.span
                  className={cn("absolute inset-y-0 left-0", highlight ? "bg-brand" : "bg-foreground")}
                  initial={{ width: 0 }}
                  animate={{ width: inView ? `${row.value}%` : 0 }}
                  transition={{ duration: 0.8, delay: i * 0.05, ease }}
                />
              </span>
              <span
                className={cn(
                  "text-right font-mono text-[11px] tabular-nums",
                  highlight ? "text-brand" : "text-muted-foreground",
                )}
              >
                {drop ? `−${drop}%` : ""}
              </span>
              <span className="text-right font-mono text-xs tabular-nums">{row.value}</span>
            </li>
          );
        })}
      </ol>

      <p className="mt-6 border-t border-rule pt-4 text-sm text-muted-foreground">
        {view === "before" ? (
          <>
            <span className="text-brand">41% of people left</span> at the pincode step. Total submissions never showed it.
          </>
        ) : (
          <>
            With a city dropdown, that step loses <span className="text-foreground">7%</span>. Everything after it recovers.
          </>
        )}
      </p>
    </div>
  );
}
