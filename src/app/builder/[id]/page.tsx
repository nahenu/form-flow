import { Suspense } from "react";
import type { Metadata } from "next";
import { Builder } from "@/components/builder/builder";

export const metadata: Metadata = { title: "Builder" };

export default function BuilderPage({ params }: PageProps<"/builder/[id]">) {
  return (
    <Suspense>
      <BuilderRoute params={params} />
    </Suspense>
  );
}

async function BuilderRoute({ params }: { params: PageProps<"/builder/[id]">["params"] }) {
  const { id } = await params;
  return <Builder formId={id} />;
}
