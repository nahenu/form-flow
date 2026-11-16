import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { events, forms } from "@/db/schema";
import { eventBatchSchema } from "@/lib/tracking-schema";

const MAX_BODY_BYTES = 16_000;

/**
 * Funnel events from public forms. Sent with navigator.sendBeacon, so it
 * accepts any content type and always answers 204: there's nobody to show an
 * error to, and the respondent's form must never break because of analytics.
 */
export async function POST(request: Request) {
  const body = await request.text();
  if (body.length > MAX_BODY_BYTES) return new Response(null, { status: 413 });

  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return new Response(null, { status: 400 });
  }
  const parsed = eventBatchSchema.safeParse(json);
  if (!parsed.success) return new Response(null, { status: 400 });
  const { formId, visitorId, source, events: batch } = parsed.data;

  await dbReady();
  const [form] = await db
    .select({ id: forms.id })
    .from(forms)
    .where(and(eq(forms.id, formId), isNotNull(forms.published), isNull(forms.deletedAt)))
    .limit(1);
  if (!form) return new Response(null, { status: 404 });

  await db.insert(events).values(
    batch.map((e) => ({
      formId,
      visitorId,
      type: e.type,
      stepId: e.stepId ?? null,
      durationMs: e.durationMs ?? null,
      source: e.type === "view" ? (source ?? {}) : null,
    })),
  );
  return new Response(null, { status: 204 });
}
