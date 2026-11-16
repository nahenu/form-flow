import "server-only";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { forms } from "@/db/schema";
import type { FormDefinition } from "./definition";

export interface PublishedForm extends FormDefinition {
  id: string;
}

/** The live (published) version of a form, or null if it doesn't exist, isn't published, or was deleted. */
export async function getPublishedForm(id: string): Promise<PublishedForm | null> {
  if (!/^[A-Za-z0-9]{1,64}$/.test(id)) return null;
  await dbReady();
  const [row] = await db
    .select({ id: forms.id, published: forms.published })
    .from(forms)
    .where(and(eq(forms.id, id), isNotNull(forms.published), isNull(forms.deletedAt)))
    .limit(1);
  return row?.published ? { id: row.id, ...row.published } : null;
}
