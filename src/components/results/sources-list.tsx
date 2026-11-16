import type { FormAnalytics } from "@/lib/analytics";
import { formatCount, formatPercent } from "@/lib/format";
import { ChartTip } from "./chart-tip";

const MAX_ROWS = 6;

/** Ranked meter list of first-touch sources; the long tail folds into "Other". */
export function SourcesList({ sources }: { sources: FormAnalytics["sources"] }) {
  if (sources.length === 0) return <p className="text-sm text-muted-foreground">No traffic yet.</p>;

  const top = sources.slice(0, MAX_ROWS - 1);
  const rest = sources.slice(MAX_ROWS - 1);
  const rows =
    rest.length > 1
      ? [...top, rest.reduce((o, s) => ({ label: "Other", visitors: o.visitors + s.visitors, submissions: o.submissions + s.submissions }), { label: "Other", visitors: 0, submissions: 0 })]
      : sources;
  const max = Math.max(...rows.map((r) => r.visitors), 1);

  return (
    <ul className="space-y-3.5">
      {rows.map((r) => {
        const conversion = r.visitors ? r.submissions / r.visitors : 0;
        return (
          <li key={r.label} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1">
            <span className="min-w-0 truncate text-sm font-medium text-foreground">{r.label}</span>
            <span className="text-right text-xs tabular-nums text-muted-foreground">
              <span className="text-sm text-foreground">{formatCount(r.visitors)}</span> visitors · {formatPercent(conversion)} convert
            </span>
            <ChartTip
              label={`${r.label}: ${formatCount(r.visitors)} visitors, ${formatCount(r.submissions)} submitted (${formatPercent(conversion)})`}
              className="col-span-2"
            >
              <div className="h-2 overflow-hidden rounded-r-[4px] bg-secondary">
                <div className="h-full rounded-r-[4px] bg-primary" style={{ width: `${(r.visitors / max) * 100}%` }} />
              </div>
            </ChartTip>
          </li>
        );
      })}
    </ul>
  );
}
