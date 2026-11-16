import type { FormAnalytics } from "@/lib/analytics";
import { formatCount, formatDay, formatPercent } from "@/lib/format";
import { ChartTip } from "./chart-tip";

/** Round the axis maximum up to a clean number (1, 2, 5 × 10^n). */
function niceMax(value: number) {
  if (value <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((m) => m * pow >= value)!;
  return step * pow;
}

/** Submissions per day: one series, so the title names it and there's no legend. */
export function DailyChart({ daily }: { daily: FormAnalytics["daily"] }) {
  const max = niceMax(Math.max(...daily.map((d) => d.submissions), 0));
  const ticks = [max, max / 2, 0];
  const labelEvery = Math.ceil(daily.length / 6);

  return (
    <div className="flex gap-3">
      <div className="flex h-40 flex-col justify-between pb-0 text-right text-[11px] tabular-nums text-muted-foreground" aria-hidden>
        {ticks.map((t) => (
          <span key={t} className="-translate-y-1/2 leading-none first:translate-y-0 last:translate-y-0">
            {formatCount(t)}
          </span>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="relative h-40">
          {ticks.map((t) => (
            <div key={t} aria-hidden className="absolute inset-x-0 border-t border-border" style={{ bottom: `${(t / max) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end gap-[2px]">
            {daily.map((d) => {
              const conv = d.visitors ? ` (${formatPercent(d.submissions / d.visitors)} of ${formatCount(d.visitors)} visitors)` : "";
              return (
                <ChartTip
                  key={d.date}
                  label={`${formatDay(d.date)}: ${formatCount(d.submissions)} ${d.submissions === 1 ? "submission" : "submissions"}${conv}`}
                  className="flex h-full min-w-0 flex-1 items-end justify-center"
                >
                  <div
                    className="w-full max-w-6 rounded-t-[4px] bg-primary transition-opacity group-hover/tip:opacity-80"
                    style={{ height: `${(d.submissions / max) * 100}%`, minHeight: d.submissions ? 2 : 0 }}
                  />
                </ChartTip>
              );
            })}
          </div>
        </div>
        <div className="mt-2 flex gap-[2px] text-[11px] text-muted-foreground" aria-hidden>
          {daily.map((d, i) => {
            const isLast = i === daily.length - 1;
            // Skip a label that would crowd the always-shown last one.
            const show = isLast || (i % labelEvery === 0 && daily.length - 1 - i >= labelEvery);
            return (
              <span key={d.date} className="relative min-w-0 flex-1 whitespace-nowrap">
                {show && (
                  <span className={isLast ? "absolute right-0" : "absolute left-1/2 -translate-x-1/2"}>{formatDay(d.date)}</span>
                )}
                &nbsp;
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
