import "server-only";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { forms, responses, type FormRow } from "@/db/schema";
import { countFields } from "./operations";
import type { Form } from "./types";

export interface FormSummary {
  id: string;
  title: string;
  stepCount: number;
  fieldCount: number;
  updatedAt: number;
  isPublished: boolean;
  responseCount: number;
}

export function rowToForm(row: Pick<FormRow, "id" | "definition" | "createdAt" | "updatedAt">): Form {
  return {
    id: row.id,
    title: row.definition.title,
    steps: row.definition.steps,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

export async function listForms(userId: string): Promise<FormSummary[]> {
  await dbReady();
  const rows = await db
    .select({
      id: forms.id,
      definition: forms.definition,
      publishedAt: forms.publishedAt,
      updatedAt: forms.updatedAt,
      responseCount: sql<number>`(select count(*) from ${responses} where ${responses.formId} = ${forms.id})::int`,
    })
    .from(forms)
    .where(and(eq(forms.userId, userId), isNull(forms.deletedAt)))
    .orderBy(desc(forms.updatedAt));

  return rows.map((r) => ({
    id: r.id,
    title: r.definition.title,
    stepCount: r.definition.steps.length,
    fieldCount: countFields({ steps: r.definition.steps } as Form),
    updatedAt: r.updatedAt.getTime(),
    isPublished: r.publishedAt !== null,
    responseCount: r.responseCount,
  }));
}

/** A form the user owns (and hasn't deleted), or null. Never returns someone else's form. */
export async function getOwnedForm(userId: string, formId: string): Promise<FormRow | null> {
  await dbReady();
  const [row] = await db
    .select()
    .from(forms)
    .where(and(eq(forms.id, formId), eq(forms.userId, userId), isNull(forms.deletedAt)))
    .limit(1);
  return row ?? null;
}
