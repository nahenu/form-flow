import { computeVisibility, type Answers } from "./logic";
import type { Field, FormDefinitionLike } from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const MAX_ANSWER_LENGTH = 5000;

/** Error message for one answer, or null if it's fine. Shared by the browser and the server. */
export function validateField(field: Field, value: string | undefined): string | null {
  const v = (value ?? "").trim();
  if (!v) return field.required ? "This one's required." : null;
  if (v.length > MAX_ANSWER_LENGTH) return "That's too long.";
  switch (field.type) {
    case "email":
      return EMAIL_RE.test(v) ? null : "That doesn't look like an email address.";
    case "phone":
      return v.replace(/\D/g, "").length >= 10 ? null : "Enter at least 10 digits.";
    case "number":
      return Number.isNaN(Number(v)) ? "Enter a number." : null;
    case "date":
      return DATE_RE.test(v) ? null : "Pick a date.";
    case "rating":
      return ["1", "2", "3", "4", "5"].includes(v) ? null : "Pick a rating.";
    case "dropdown":
    case "multiple_choice":
      return field.options.includes(v) ? null : "Pick one of the options.";
    default:
      return null;
  }
}

/**
 * Validate a full submission against a form: only visible fields count,
 * hidden or unknown answers are dropped. Returns the cleaned answers or the
 * errors by field id.
 */
export function validateSubmission(
  form: FormDefinitionLike,
  answers: Answers,
): { ok: true; answers: Record<string, string> } | { ok: false; errors: Record<string, string> } {
  const visible = computeVisibility(form, answers);
  const errors: Record<string, string> = {};
  const clean: Record<string, string> = {};

  for (const step of form.steps) {
    for (const field of step.fields) {
      if (!visible.has(field.id)) continue;
      const error = validateField(field, answers[field.id]);
      if (error) errors[field.id] = error;
      const value = (answers[field.id] ?? "").trim();
      if (value) clean[field.id] = value;
    }
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, answers: clean };
}
