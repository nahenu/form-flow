import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, PencilLine } from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { DailyChart } from "@/components/results/daily-chart";
import { Funnel } from "@/components/results/funnel";
import { ResponsesTable } from "@/components/results/responses-table";
import { SourcesList } from "@/components/results/sources-list";
import { getFormAnalytics, getResponses, parseRange, type Range } from "@/lib/analytics";
import { requireUser } from "@/lib/auth";
import { getOwnedForm } from "@/lib/forms/server";
import { formatCount, formatDuration, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Results" };

export default function ResultsPage({ params, searchParams }: PageProps<"/forms/[id]/results">) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-muted/40">
      <Suspense fallback={<AppHeader />}>
        <Header />
      </Suspense>
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:py-10">
        <Suspense fallback={<div role="status" className="h-[40rem] animate-pulse rounded-2xl bg-white"><span className="sr-only">Loading results…</span></div>}>
          <Results params={params} searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}

async function Header() {
  const user = await requireUser();
  return <AppHeader user={{ name: user.name, email: user.email }} />;
}

async function Results({
  params,
  searchParams,
}: {
  params: PageProps<"/forms/[id]/results">["params"];
  searchParams: PageProps<"/forms/[id]/results">["searchParams"];
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/forms/${id}/results`);
  const row = await getOwnedForm(user.id, id);
  if (!row) notFound();

  const range = parseRange(query.range);
  // Report against the live version respondents actually saw; fall back to the draft before first publish.
  const definition = row.published ?? row.definition;
  const [data, responses] = await Promise.all([getFormAnalytics(id, definition, range), getResponses(id)]);

  return (
    <>
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Your forms
      </Link>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate font-display text-3xl text-foreground sm:text-4xl">{definition.title || "Untitled form"}</h1>
          <p className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
            {row.publishedAt ? (
              <>
                <span className="size-2 rounded-full bg-emerald-500" aria-hidden /> Live
              </>
            ) : (
              "Not published yet"
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RangeFilter id={id} range={range} />
          <Link
            href={`/builder/${id}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-sm font-medium text-foreground hover:bg-muted"
          >
            <PencilLine className="size-4" /> Edit form
          </Link>
        </div>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Completion rate" value={formatPercent(data.completionRate)} hint="of visitors submitted" hero />
        <Kpi label="Visitors" value={formatCount(data.visitors)} hint="unique, opened the form" />
        <Kpi label="Started" value={formatCount(data.started)} hint={data.visitors ? `${formatPercent(data.started / data.visitors)} finished step 1` : "finished step 1"} />
        <Kpi label="Submitted" value={formatCount(data.submissions)} hint="responses" />
        <Kpi label="Time to submit" value={formatDuration(data.medianSecondsToSubmit)} hint="median" />
      </dl>

      {data.visitors === 0 ? (
        <NoTraffic id={id} published={!!row.publishedAt} />
      ) : (
        <>
          <Panel title="Funnel" subtitle="How many visitors reached each step, and where people left." className="mt-6">
            <Funnel data={data} />
          </Panel>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Panel title="Submissions per day" subtitle={range === "all" ? "Recent days, UTC" : "UTC days"}>
              <DailyChart daily={data.daily} />
            </Panel>
            <Panel title="Where visitors came from" subtitle="First-touch: UTM source, else referring site.">
              <SourcesList sources={data.sources} />
            </Panel>
          </div>
        </>
      )}

      <section aria-labelledby="responses-heading" className="mt-6 overflow-hidden rounded-2xl border border-border bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 id="responses-heading" className="font-display text-lg text-foreground">
              Responses
            </h2>
            <p className="text-sm text-muted-foreground">
              {responses.length === 100 ? "Latest 100. Export for the full list." : `${responses.length} in total.`}
            </p>
          </div>
          {responses.length > 0 && (
            <a
              href={`/api/forms/${id}/export`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-white hover:bg-[#0b3aa6]"
            >
              <Download className="size-4" /> Export CSV
            </a>
          )}
        </div>
        <ResponsesTable rows={responses} definition={definition} />
      </section>
    </>
  );
}

function RangeFilter({ id, range }: { id: string; range: Range }) {
  const options: [Range, string][] = [
    ["7d", "7 days"],
    ["30d", "30 days"],
    ["all", "All time"],
  ];
  return (
    <nav aria-label="Date range" className="flex rounded-lg bg-secondary p-0.5 text-sm">
      {options.map(([value, label]) => (
        <Link
          key={value}
          href={`/forms/${id}/results?range=${value}`}
          aria-current={range === value ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1.5 font-medium",
            range === value ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

function Kpi({ label, value, hint, hero = false }: { label: string; value: string; hint: string; hero?: boolean }) {
  return (
    <div className={cn("rounded-2xl border p-4", hero ? "col-span-2 border-primary bg-primary text-white lg:col-span-1" : "border-border bg-white")}>
      <dt className={cn("text-xs font-medium", hero ? "text-white/75" : "text-muted-foreground")}>{label}</dt>
      <dd className="mt-1 font-display text-3xl tabular-nums">{value}</dd>
      <dd className={cn("mt-0.5 text-xs", hero ? "text-white/75" : "text-muted-foreground")}>{hint}</dd>
    </div>
  );
}

function Panel({ title, subtitle, children, className }: { title: string; subtitle: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-border bg-white p-5 sm:p-6", className)}>
      <h2 className="font-display text-lg text-foreground">{title}</h2>
      <p className="mb-6 text-sm text-muted-foreground">{subtitle}</p>
      {children}
    </section>
  );
}

function NoTraffic({ id, published }: { id: string; published: boolean }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-input bg-white px-6 py-12 text-center">
      <h2 className="font-display text-xl text-foreground">No visitors in this period</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {published
          ? "Share the link or embed the form. The funnel fills in as people open it."
          : "Publish the form first, then share its link. The funnel fills in as people open it."}
      </p>
      <Link href={`/builder/${id}`} className="mt-5 inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-white hover:bg-[#0b3aa6]">
        {published ? "Get the link" : "Open the builder"}
      </Link>
    </div>
  );
}
