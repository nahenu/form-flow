import type { Metadata } from "next";
import { FormsDashboard } from "@/components/app/forms-dashboard";

export const metadata: Metadata = { title: "Your forms" };

export default function DashboardPage() {
  return <FormsDashboard />;
}
