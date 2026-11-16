import "server-only";
import { and, desc, eq, gte, inArray, sql, type SQL } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { events, responses, type TrafficSource } from "@/db/schema";
import type { FormDefinition } from "@/lib/forms/definition";

export type Range = "7d" | "30d" | "all";

export function parseRange(value: unknown): Range {
  return value === "7d" || value === "all" ? value : "30d";
}

function since(range: Range): Date | null {
  if (range === "all") return null;
  return new Date(Date.now() - (range === "7d" ? 7 : 30) * 86_400_000);
}

export interface StepStats {
  stepId: string;
  title: string;
  /** Unique visitors who saw this step. */
  viewed: number;
  /** Unique visitors who finished it. */
  completed: number;
  /** Median seconds spent on the step by those who finished it. */
  medianSeconds: number | null;
}

export interface FormAnalytics {
  visitors: number;
  started: number;
  submissions: number;
  completionRate: number;
  medianSecondsToSubmit: number | null;
  steps: StepStats[];
  daily: { date: string; visitors: number; submissions: number }[];
  sources: { label: string; visitors: number; submissions: number }[];
}

/** Human name for where a visitor came from: UTM source, else referrer domain, else "Direct". */
export function sourceLabel(source: TrafficSource | null | undefined): string {
  if (source?.utmSource) return source.utmSource.toLowerCase();
  if (source?.referrer) {
    try {
      return new URL(source.referrer).hostname.replace(/^www\./, "");
    } catch {
      /* not a URL */
    }
  }
  return "Direct";
}

export async function getFormAnalytics(formId: string, definition: FormDefinition, range: Range): Promise<FormAnalytics> {
  await dbReady();
  const from = since(range);
  const inRange = (column: typeof events.createdAt | typeof responses.createdAt): SQL | undefined =>
    from ? gte(column, from) : undefined;
  const ev = (type: "view" | "step_view" | "step_complete") => and(eq(events.formId, formId), eq(events.type, type), inRange(events.createdAt));

  const [[visitorRow], [startedRow], stepRows, [submitRow], dailyViews, dailySubmits, viewSources, submitSources] = await Promise.all([
    db.select({ n: sql<number>`count(distinct ${events.visitorId})::int` }).from(events).where(ev("view")),
    db.select({ n: sql<number>`count(distinct ${events.visitorId})::int` }).from(events).where(ev("step_complete")),
    db
      .select({
        stepId: events.stepId,
        type: events.type,
        visitors: sql<number>`count(distinct ${events.visitorId})::int`,
        medianMs: sql<number | null>`percentile_cont(0.5) within group (order by ${events.durationMs})`,
      })
      .from(events)
      .where(and(eq(events.formId, formId), inArray(events.type, ["step_view", "step_complete"]), inRange(events.createdAt)))
      .groupBy(events.stepId, events.type),
    db
      .select({
        n: sql<number>`count(*)::int`,
        medianMs: sql<number | null>`percentile_cont(0.5) within group (order by ${responses.durationMs})`,
      })
      .from(responses)
      .where(and(eq(responses.formId, formId), inRange(responses.createdAt))),
    db
      .select({ day: sql<string>`to_char(date_trunc('day', ${events.createdAt}), 'YYYY-MM-DD')`, n: sql<number>`count(distinct ${events.visitorId})::int` })
      .from(events)
      .where(ev("view"))
      .groupBy(sql`1`),
    db
      .select({ day: sql<string>`to_char(date_trunc('day', ${responses.createdAt}), 'YYYY-MM-DD')`, n: sql<number>`count(*)::int` })
      .from(responses)
      .where(and(eq(responses.formId, formId), inRange(responses.createdAt)))
      .groupBy(sql`1`),
    // First view per visitor carries their first-touch source.
    db
      .selectDistinctOn([events.visitorId], { visitorId: events.visitorId, source: events.source })
      .from(events)
      .where(ev("view"))
      .orderBy(events.visitorId, events.createdAt),
    db
      .select({ source: responses.source })
      .from(responses)
      .where(and(eq(responses.formId, formId), inRange(responses.createdAt))),
  ]);

  const stat = (stepId: string, type: string) => stepRows.find((r) => r.stepId === stepId && r.type === type);
  const steps: StepStats[] = definition.steps
    .filter((s) => s.fields.length > 0)
    .map((s) => {
      const completed = stat(s.id, "step_complete");
      return {
        stepId: s.id,
        title: s.title || "Untitled step",
        viewed: stat(s.id, "step_view")?.visitors ?? 0,
        completed: completed?.visitors ?? 0,
        medianSeconds: completed?.medianMs != null ? Math.round(Number(completed.medianMs) / 1000) : null,
      };
    });

  const visitors = visitorRow?.n ?? 0;
  const submissions = submitRow?.n ?? 0;

  return {
    visitors,
    started: startedRow?.n ?? 0,
    submissions,
    completionRate: visitors ? submissions / visitors : 0,
    medianSecondsToSubmit: submitRow?.medianMs != null ? Math.round(Number(submitRow.medianMs) / 1000) : null,
    steps,
    daily: fillDays(range, dailyViews, dailySubmits),
    sources: groupSources(
      viewSources.map((v) => v.source),
      submitSources.map((s) => s.source),
    ),
  };
}

/** One entry per day in the window (empty days included), so the chart's x-axis is honest. */
function fillDays(range: Range, views: { day: string; n: number }[], submits: { day: string; n: number }[]) {
  const viewMap = new Map(views.map((v) => [v.day, v.n]));
  const submitMap = new Map(submits.map((s) => [s.day, s.n]));
  const known = [...viewMap.keys(), ...submitMap.keys()].sort();
  const days = range === "7d" ? 7 : range === "30d" ? 30 : Math.min(90, Math.max(14, daysBetween(known[0], todayUtc()) + 1));
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    out.push({ date, visitors: viewMap.get(date) ?? 0, submissions: submitMap.get(date) ?? 0 });
  }
  return out;
}

const todayUtc = () => new Date().toISOString().slice(0, 10);
function daysBetween(a: string | undefined, b: string) {
  return a ? Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000) : 0;
}

function groupSources(views: (TrafficSource | null)[], submits: (TrafficSource | null)[]) {
  const map = new Map<string, { visitors: number; submissions: number }>();
  for (const s of views) {
    const entry = map.get(sourceLabel(s)) ?? { visitors: 0, submissions: 0 };
    entry.visitors++;
    map.set(sourceLabel(s), entry);
  }
  for (const s of submits) {
    const entry = map.get(sourceLabel(s)) ?? { visitors: 0, submissions: 0 };
    entry.submissions++;
    map.set(sourceLabel(s), entry);
  }
  return [...map.entries()]
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.visitors - a.visitors || b.submissions - a.submissions);
}

export interface ResponseRowView {
  id: string;
  createdAt: number;
  source: string;
  answers: Record<string, string>;
}

export async function getResponses(formId: string, limit = 100): Promise<ResponseRowView[]> {
  await dbReady();
  const rows = await db
    .select({ id: responses.id, createdAt: responses.createdAt, source: responses.source, answers: responses.answers })
    .from(responses)
    .where(eq(responses.formId, formId))
    .orderBy(desc(responses.createdAt))
    .limit(limit);
  return rows.map((r) => ({ id: r.id, createdAt: r.createdAt.getTime(), source: sourceLabel(r.source), answers: r.answers }));
}
