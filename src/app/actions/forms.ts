"use server";

import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { z } from "zod";
import { db, dbReady } from "@/db";
import { forms } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { formDefinitionSchema, toDefinition } from "@/lib/forms/definition";
import { getOwnedForm } from "@/lib/forms/server";
import { formFromTemplate } from "@/lib/forms/templates";
import { newPublicId } from "@/lib/id";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

async function userIdOrNull() {
  const session = await getSession();
  return session?.user.id ?? null;
}

const owned = (id: string, userId: string) => and(eq(forms.id, id), eq(forms.userId, userId));
const formId = z.string().min(1).max(64);

export async function createForm(template: unknown): Promise<Result<{ id: string }>> {
  const userId = await userIdOrNull();
  if (!userId) return { ok: false, error: "Not signed in" };
  const parsed = z.enum(["blank", "lead"]).safeParse(template);
  if (!parsed.success) return { ok: false, error: "Unknown template" };

  const id = newPublicId();
  await db.insert(forms).values({ id, userId, definition: toDefinition(formFromTemplate(parsed.data)) });
  return { ok: true, id };
}

export async function saveForm(id: unknown, definition: unknown): Promise<Result<{ updatedAt: number }>> {
  const userId = await userIdOrNull();
  if (!userId) return { ok: false, error: "Not signed in" };
  const parsedId = formId.safeParse(id);
  const parsed = formDefinitionSchema.safeParse(definition);
  if (!parsedId.success || !parsed.success) return { ok: false, error: "Invalid form" };

  const [row] = await db
    .update(forms)
    .set({ definition: parsed.data })
    .where(and(owned(parsedId.data, userId), isNull(forms.deletedAt)))
    .returning({ updatedAt: forms.updatedAt });
  return row ? { ok: true, updatedAt: row.updatedAt.getTime() } : { ok: false, error: "Form not found" };
}

export async function duplicateForm(id: unknown): Promise<Result<{ id: string }>> {
  const userId = await userIdOrNull();
  const parsedId = formId.safeParse(id);
  if (!userId || !parsedId.success) return { ok: false, error: "Not allowed" };

  const source = await getOwnedForm(userId, parsedId.data);
  if (!source) return { ok: false, error: "Form not found" };
  const copyId = newPublicId();
  await db.insert(forms).values({
    id: copyId,
    userId,
    definition: { ...source.definition, title: `${source.definition.title} (copy)` },
  });
  return { ok: true, id: copyId };
}

/** Soft delete; `restoreForm` undoes it. */
export async function deleteForm(id: unknown): Promise<Result> {
  const userId = await userIdOrNull();
  const parsedId = formId.safeParse(id);
  if (!userId || !parsedId.success) return { ok: false, error: "Not allowed" };
  await dbReady();
  const [row] = await db
    .update(forms)
    .set({ deletedAt: new Date() })
    .where(and(owned(parsedId.data, userId), isNull(forms.deletedAt)))
    .returning({ id: forms.id });
  return row ? { ok: true } : { ok: false, error: "Form not found" };
}

export async function restoreForm(id: unknown): Promise<Result> {
  const userId = await userIdOrNull();
  const parsedId = formId.safeParse(id);
  if (!userId || !parsedId.success) return { ok: false, error: "Not allowed" };
  const [row] = await db
    .update(forms)
    .set({ deletedAt: null })
    .where(and(owned(parsedId.data, userId), isNotNull(forms.deletedAt)))
    .returning({ id: forms.id });
  return row ? { ok: true } : { ok: false, error: "Form not found" };
}
