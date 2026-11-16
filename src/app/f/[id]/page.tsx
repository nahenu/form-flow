import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PublicForm } from "@/components/forms/public-form";
import { LogoMark } from "@/components/marketing/logo";
import { getPublishedForm } from "@/lib/forms/public";
import { cn } from "@/lib/utils";

/** The form's own title is the tab title (streams in with the rest of the request-time content). */
export async function generateMetadata({ params }: PageProps<"/f/[id]">): Promise<Metadata> {
  const { id } = await params;
  await connection();
  const form = await getPublishedForm(id);
  return {
    title: form?.title || "Form",
    // Forms often collect personal details; keep them out of search results.
    robots: { index: false, follow: false },
  };
}

export default function PublicFormPage({ params, searchParams }: PageProps<"/f/[id]">) {
  return (
    <Suspense fallback={<div className="mx-auto mt-16 h-96 w-full max-w-xl animate-pulse rounded-2xl bg-white" />}>
      <PublicFormRoute params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function PublicFormRoute({
  params,
  searchParams,
}: {
  params: PageProps<"/f/[id]">["params"];
  searchParams: PageProps<"/f/[id]">["searchParams"];
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  // Live data, per request: never part of a prerendered shell.
  await connection();
  const form = await getPublishedForm(id);
  if (!form) notFound();
  const embedded = query.embed === "1";

  return (
    <main className={cn("flex flex-col", embedded ? "bg-transparent p-1" : "min-h-dvh bg-muted/50 px-4 py-10 sm:py-16")}>
      {/* Embedded forms sit on the host page's background, not ours. */}
      {embedded && <style>{"html,body{background:transparent!important}"}</style>}
      <div className="mx-auto w-full max-w-xl flex-1">
        <PublicForm form={form} embedded={embedded} />
      </div>
      {!embedded && (
        <footer className="mt-10 text-center">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
            <LogoMark className="size-4 rounded [&_svg]:size-2.5" /> Made with FormFlow
          </Link>
        </footer>
      )}
    </main>
  );
}
