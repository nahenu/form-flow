"use server";

import { db } from "@/db";
import { events, responses } from "@/db/schema";
import { getPublishedForm } from "@/lib/forms/public";
import { validateSubmission } from "@/lib/forms/validation";
import { newPublicId } from "@/lib/id";
import { submissionSchema } from "@/lib/tracking-schema";

type SubmitResult = { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Public: anyone with the link can submit. Never trust the browser: the
 * answers are re-validated here against the published form, with the same
 * visibility rules, and anything hidden or unknown is dropped.
 */
export async function submitResponse(input: unknown): Promise<SubmitResult> {
  const parsed = submissionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Something about this submission looks wrong. Please reload and try again." };
  const { formId, visitorId, answers, source, durationMs, website } = parsed.data;

  // Bots fill every field, including the invisible honeypot. Pretend it worked.
  if (website) return { ok: true };

  const form = await getPublishedForm(formId);
  if (!form) return { ok: false, error: "This form isn't accepting responses anymore." };

  const checked = validateSubmission(form, answers);
  if (!checked.ok) {
    return { ok: false, error: "Some answers need another look.", fieldErrors: checked.errors };
  }

  await db.insert(responses).values({
    id: newPublicId(16),
    formId,
    visitorId,
    answers: checked.answers,
    source: source ?? {},
    durationMs: durationMs ?? null,
  });
  await db.insert(events).values({ formId, visitorId, type: "submit" });
  return { ok: true };
}
