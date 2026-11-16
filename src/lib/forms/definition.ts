/**
 * The persisted shape of a form (everything except ids/timestamps, which live
 * in table columns) and a zod schema to validate anything coming from a client.
 */
import { z } from "zod";
import type { Form } from "./types";

export type FormDefinition = Pick<Form, "title" | "steps">;

const MAX_STEPS = 30;
const MAX_FIELDS_PER_STEP = 50;
const MAX_OPTIONS = 100;
const text = (max: number) => z.string().max(max);

const conditionSchema = z.object({
  fieldId: text(64),
  operator: z.enum(["equals", "not_equals", "is_answered", "is_empty"]),
  value: text(500),
});

const fieldSchema = z.object({
  id: text(64).min(1),
  type: z.enum(["short_text", "long_text", "email", "phone", "number", "dropdown", "multiple_choice", "date", "rating"]),
  label: text(500),
  placeholder: text(200),
  helpText: text(1000),
  required: z.boolean(),
  options: z.array(text(500)).max(MAX_OPTIONS),
  condition: conditionSchema.optional(),
});

const routeSchema = z.object({
  id: text(64).min(1),
  condition: conditionSchema,
  to: text(64).min(1),
});

const stepSchema = z.object({
  id: text(64).min(1),
  title: text(200),
  fields: z.array(fieldSchema).max(MAX_FIELDS_PER_STEP),
  routes: z.array(routeSchema).max(20).optional(),
  next: text(64).min(1).optional(),
  position: z.object({ x: z.number().finite().min(-1e5).max(1e5), y: z.number().finite().min(-1e5).max(1e5) }).optional(),
});

export const formDefinitionSchema = z.object({
  title: text(200),
  steps: z.array(stepSchema).min(1).max(MAX_STEPS),
});

export function toDefinition(form: Pick<Form, "title" | "steps">): FormDefinition {
  return { title: form.title, steps: form.steps };
}
