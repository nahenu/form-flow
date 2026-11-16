import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Builder, BuilderSkeleton } from "@/components/builder/builder";
import { requireUser } from "@/lib/auth";
import { getOwnedForm, rowToForm } from "@/lib/forms/server";
import { stableStringify } from "@/lib/stable-json";

export const metadata: Metadata = { title: "Builder" };

export default function BuilderPage({ params }: PageProps<"/builder/[id]">) {
  return (
    <Suspense fallback={<BuilderSkeleton />}>
      <BuilderRoute params={params} />
    </Suspense>
  );
}

async function BuilderRoute({ params }: { params: PageProps<"/builder/[id]">["params"] }) {
  const { id } = await params;
  const user = await requireUser(`/builder/${id}`);
  const row = await getOwnedForm(user.id, id);
  if (!row) notFound();
  return <Builder initial={rowToForm(row)} published={row.published ? stableStringify(row.published) : null} />;
}
