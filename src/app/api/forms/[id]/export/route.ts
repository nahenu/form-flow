import { asc, eq } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { responses } from "@/db/schema";
import { sourceLabel } from "@/lib/analytics";
import { auth } from "@/lib/auth";
import { getOwnedForm } from "@/lib/forms/server";

/**
 * Quote a CSV cell. Cells starting with = + - @ are prefixed with an apostrophe
 * so spreadsheet apps don't run them as formulas (CSV injection).
 */
function cell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(request: Request, { params }: RouteContext<"/api/forms/[id]/export">) {
  const { id } = await params;
  await dbReady();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return new Response("Sign in to export responses.", { status: 401 });

  const form = await getOwnedForm(session.user.id, id);
  if (!form) return new Response("Form not found.", { status: 404 });

  const definition = form.published ?? form.definition;
  const fields = definition.steps.flatMap((s) => s.fields);
  const rows = await db.select().from(responses).where(eq(responses.formId, id)).orderBy(asc(responses.createdAt));

  const lines = [
    ["Submitted at (UTC)", "Source", "UTM campaign", ...fields.map((f) => f.label || "Untitled")].map(cell).join(","),
    ...rows.map((r) =>
      [r.createdAt.toISOString(), sourceLabel(r.source), r.source.utmCampaign ?? "", ...fields.map((f) => r.answers[f.id] ?? "")]
        .map(cell)
        .join(","),
    ),
  ];

  const slug = (definition.title || "form").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "form";
  // BOM so Excel opens UTF-8 (names in Hindi, Tamil...) correctly.
  return new Response(`﻿${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-responses.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
