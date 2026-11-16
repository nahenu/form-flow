"use client";

import { useRef, useState } from "react";
import { m, useInView } from "motion/react";
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
    <div className="rounded-[1.75rem] border border-border bg-white p-6 shadow-[0_30px_60px_-35px_rgba(9,49,141,0.35)] sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Example funnel · illustrative
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-6xl text-primary">
              <NumberTicker value={completion} startValue={33} className="tracking-tight text-primary dark:text-primary" />%
            </span>
            <span className="text-sm font-medium text-muted-foreground">finish the form</span>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Funnel version"
          className="relative isolate grid grid-cols-2 rounded-full bg-secondary p-1 text-sm font-semibold"
        >
          <span
            aria-hidden
            className={cn(
              "absolute inset-y-1 left-1 -z-10 w-[calc(50%-0.25rem)] rounded-full bg-primary transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              view === "after" && "translate-x-full",
            )}
          />
          {(["before", "after"] as const).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={cn(
                "rounded-full px-4 py-1.5 capitalize transition-colors",
                view === v ? "text-white" : "text-primary/70 hover:text-primary",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <ol ref={listRef} className="mt-8 space-y-2.5">
        {rows.map((row, i) => {
          const prev = rows[i - 1]?.value;
          const drop = prev ? Math.round(((prev - row.value) / prev) * 100) : null;
          const highlight = row.culprit && view === "before";
          return (
            <li
              key={i}
              className="grid grid-cols-[5.25rem_1fr_2.5rem_2rem] items-center gap-2.5 text-sm sm:grid-cols-[6.5rem_1fr_2.75rem_2.25rem] sm:gap-3"
            >
              <span className={cn("truncate font-medium", highlight ? "font-bold text-[#d6337f]" : "text-muted-foreground")}>
                {row.label}
              </span>
              <span className="relative h-8 overflow-hidden rounded-lg bg-secondary">
                <m.span
                  className={cn("absolute inset-y-0 left-0 rounded-lg", highlight ? "bg-brand" : "bg-primary")}
                  initial={{ width: 0 }}
                  animate={{ width: inView ? `${row.value}%` : 0 }}
                  transition={{ duration: 0.8, delay: i * 0.05, ease }}
                />
              </span>
              <span
                className={cn(
                  "text-right text-[11px] font-medium tabular-nums",
                  highlight ? "font-bold text-[#d6337f]" : "text-muted-foreground",
                )}
              >
                {drop ? `−${drop}%` : ""}
              </span>
              <span className="text-right text-xs font-semibold tabular-nums text-primary">{row.value}</span>
            </li>
          );
        })}
      </ol>

      <p className="mt-6 rounded-xl bg-brand-soft px-4 py-3 text-sm text-primary">
        {view === "before" ? (
          <>
            <strong>41% of people left at the pincode step.</strong> Total submissions never showed it.
          </>
        ) : (
          <>
            <strong>With a city dropdown, that step loses 7%.</strong> Everything after it recovers.
          </>
        )}
      </p>
    </div>
  );
}
