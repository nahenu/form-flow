import { Suspense } from "react";
import type { Metadata } from "next";
import { AppHeader } from "@/components/app/app-header";
import { DashboardSkeleton, FormsDashboard } from "@/components/app/forms-dashboard";
import { requireUser } from "@/lib/auth";
import { listForms } from "@/lib/forms/server";

export const metadata: Metadata = { title: "Your forms" };

export default function DashboardPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-muted/40">
      <Suspense fallback={<AppHeader />}>
        <HeaderWithUser />
      </Suspense>
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:py-14">
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </main>
    </div>
  );
}

async function HeaderWithUser() {
  const user = await requireUser("/dashboard");
  return <AppHeader user={{ name: user.name, email: user.email }} />;
}

async function DashboardContent() {
  const user = await requireUser("/dashboard");
  return <FormsDashboard forms={await listForms(user.id)} />;
}
