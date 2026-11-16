import { z } from "zod";

const short = (max: number) => z.string().trim().max(max);

/** First-touch attribution, as sent by browsers. Everything is optional and length-capped. */
export const trafficSourceSchema = z
  .object({
    utmSource: short(200).optional(),
    utmMedium: short(200).optional(),
    utmCampaign: short(200).optional(),
    referrer: short(500).optional(),
  })
  .default({});

export const visitorIdSchema = z.string().regex(/^[A-Za-z0-9-]{8,64}$/);
export const formIdSchema = z.string().regex(/^[A-Za-z0-9]{1,64}$/);

export const eventBatchSchema = z.object({
  formId: formIdSchema,
  visitorId: visitorIdSchema,
  source: trafficSourceSchema.optional(),
  events: z
    .array(
      z.object({
        type: z.enum(["view", "step_view", "step_complete"]),
        stepId: z.string().max(64).optional(),
        // Cap at one hour: anything longer is someone who left the tab open.
        durationMs: z.number().int().min(0).max(3_600_000).optional(),
      }),
    )
    .min(1)
    .max(25),
});

export const submissionSchema = z.object({
  formId: formIdSchema,
  visitorId: visitorIdSchema,
  answers: z.record(z.string().max(64), z.string().max(5000)).refine((a) => Object.keys(a).length <= 300),
  source: trafficSourceSchema.optional(),
  durationMs: z.number().int().min(0).max(86_400_000).optional(),
  /** Honeypot: a hidden field humans never fill in. */
  website: z.string().max(500).optional(),
});
