const integer = new Intl.NumberFormat("en-IN");
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/** 1,284 below ten thousand, then 12.9K. */
export function formatCount(n: number): string {
  return n < 10_000 ? integer.format(n) : compact.format(n);
}

export function formatPercent(ratio: number, digits = 0): string {
  if (!Number.isFinite(ratio)) return "–";
  return `${(ratio * 100).toFixed(digits)}%`;
}

/** 42s, 3m 05s, 1h 02m. */
export function formatDuration(seconds: number | null): string {
  if (seconds == null) return "–";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ${String(seconds % 60).padStart(2, "0")}s`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

export function formatDay(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
}
