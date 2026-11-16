import { TrendingDown } from "lucide-react";
import type { FormAnalytics } from "@/lib/analytics";
import { formatCount, formatDuration, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ChartTip } from "./chart-tip";

/** Steps with too few visitors make noisy percentages; don't call those out. */
const MIN_FOR_CALLOUT = 5;

/**
 * Funnel as a meter list: one row per step with its name, a bar of how many
 * visitors reached it, and the figures. The step that loses the largest share
 * of the people who saw it is emphasised (pink + icon + text, never colour alone).
 */
export function Funnel({ data }: { data: FormAnalytics }) {
  const { visitors, steps, submissions } = data;
  const dropRate = (s: (typeof steps)[number]) => (s.viewed ? (s.viewed - s.completed) / s.viewed : 0);
  const worst = steps
    .filter((s) => s.viewed >= MIN_FOR_CALLOUT)
    .reduce<(typeof steps)[number] | null>((w, s) => (!w || dropRate(s) > dropRate(w) ? s : w), null);
  const showWorst = worst && dropRate(worst) > 0;

  const rows = [
    ...steps.map((s, i) => ({ key: s.stepId, name: `${i + 1}. ${s.title}`, value: s.viewed, step: s })),
    { key: "submitted", name: "Submitted", value: submissions, step: null },
  ];

  return (
    <ol className="space-y-4">
      <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[13rem_minmax(0,1fr)_7.5rem]">
        <span className="text-sm font-medium text-foreground sm:col-start-1 sm:row-start-1">Opened the form</span>
        <span className="text-right text-sm tabular-nums text-foreground sm:col-start-3 sm:row-start-1">{formatCount(visitors)}</span>
        <Bar ratio={visitors ? 1 : 0} label={`${formatCount(visitors)} unique visitors opened the form.`} className="col-span-2 sm:col-span-1 sm:col-start-2 sm:row-start-1" />
      </li>

      {rows.map((row) => {
        const ratio = visitors ? row.value / visitors : 0;
        const s = row.step;
        const isWorst = showWorst && s?.stepId === worst.stepId;
        const left = s ? s.viewed - s.completed : 0;
        const tip = s
          ? `${s.title}: ${formatCount(s.viewed)} of ${formatCount(visitors)} visitors (${formatPercent(ratio)}) reached this step, ${formatCount(s.completed)} finished it${s.medianSeconds != null ? `, median ${formatDuration(s.medianSeconds)}` : ""}.`
          : `${formatCount(row.value)} of ${formatCount(visitors)} visitors (${formatPercent(ratio)}) submitted.`;

        return (
          <li
            key={row.key}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[13rem_minmax(0,1fr)_7.5rem]"
          >
            <span className="min-w-0 truncate text-sm font-medium text-foreground sm:col-start-1 sm:row-start-1" title={row.name}>
              {row.name}
            </span>
            <span className="text-right text-sm tabular-nums text-foreground sm:col-start-3 sm:row-start-1">
              {formatCount(row.value)} <span className="text-muted-foreground">· {formatPercent(ratio)}</span>
            </span>
            <Bar ratio={ratio} label={tip} highlight={!!isWorst} className="col-span-2 sm:col-span-1 sm:col-start-2 sm:row-start-1" />
            {s && s.viewed > 0 && (
              <p className={cn("col-span-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground sm:col-start-2 sm:col-end-4 sm:row-start-2", isWorst && "text-foreground")}>
                {isWorst && (
                  <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-brand-soft px-2 py-0.5 font-semibold text-[#9d2860]">
                    <TrendingDown className="size-3.5" aria-hidden /> Biggest drop-off
                  </span>
                )}
                {formatCount(left)} left here ({formatPercent(dropRate(s))} of those who saw it)
                {s.medianSeconds != null && <> · median {formatDuration(s.medianSeconds)}</>}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Bar({ ratio, label, highlight = false, className }: { ratio: number; label: string; highlight?: boolean; className?: string }) {
  return (
    <ChartTip label={label} className={cn("py-1", className)}>
      {/* Track is a lighter step of the same ramp; the fill grows from a square baseline to a 4px rounded end. */}
      <div className="h-5 overflow-hidden rounded-r-[4px] bg-secondary">
        <div
          className={cn("h-full rounded-r-[4px]", highlight ? "bg-brand" : "bg-primary")}
          style={{ width: `${Math.max(ratio * 100, ratio > 0 ? 1 : 0)}%` }}
        />
      </div>
    </ChartTip>
  );
}
