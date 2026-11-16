/**
 * Conditional logic: which fields (and therefore which steps) a respondent sees,
 * given their answers so far. Everything here is pure so it can be unit tested
 * and shared by the builder, the preview and, later, the public form.
 */
import type { Condition, ConditionOperator, Field, FieldType, FormDefinitionLike, Step } from "./types";

export type Answers = Record<string, string | undefined>;

const VALUE_TYPES: FieldType[] = ["dropdown", "multiple_choice", "rating"];

export const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  equals: "is",
  not_equals: "is not",
  is_answered: "is answered",
  is_empty: "is empty",
};

export function operatorNeedsValue(op: ConditionOperator) {
  return op === "equals" || op === "not_equals";
}

/** Operators that make sense for a source field of this type. */
export function operatorsFor(type: FieldType): ConditionOperator[] {
  return VALUE_TYPES.includes(type) ? ["equals", "not_equals", "is_answered", "is_empty"] : ["is_answered", "is_empty"];
}

/** The concrete values a rule can compare against for this source field. */
export function valuesFor(field: Field): string[] {
  if (field.type === "rating") return ["1", "2", "3", "4", "5"];
  if (field.type === "dropdown" || field.type === "multiple_choice") return field.options.filter((o) => o.trim() !== "");
  return [];
}

/** All fields in display order. */
export function allFields(form: FormDefinitionLike): Field[] {
  return form.steps.flatMap((s) => s.fields);
}

/** Fields that come before `fieldId` in the form, i.e. valid rule sources for it. */
export function earlierFields(form: FormDefinitionLike, fieldId: string): Field[] {
  const fields = allFields(form);
  const index = fields.findIndex((f) => f.id === fieldId);
  return index === -1 ? [] : fields.slice(0, index);
}

/** A sensible starting rule: compare against the nearest earlier choice question, if there is one. */
export function defaultCondition(form: FormDefinitionLike, fieldId: string): Condition | null {
  const earlier = earlierFields(form, fieldId);
  if (earlier.length === 0) return null;
  const source = [...earlier].reverse().find((f) => valuesFor(f).length > 0) ?? earlier[earlier.length - 1];
  return conditionForSource(source);
}

export function conditionForSource(source: Field): Condition {
  const values = valuesFor(source);
  return values.length
    ? { fieldId: source.id, operator: "equals", value: values[0] }
    : { fieldId: source.id, operator: "is_answered", value: "" };
}

export type ConditionProblem = "missing-source" | "source-after" | "missing-value";

/** Why a field's rule can't work as written, or null if it's fine (or there is no rule). */
export function conditionProblem(form: FormDefinitionLike, field: Field): ConditionProblem | null {
  const condition = field.condition;
  if (!condition) return null;
  const fields = allFields(form);
  const sourceIndex = fields.findIndex((f) => f.id === condition.fieldId);
  if (sourceIndex === -1) return "missing-source";
  if (sourceIndex >= fields.findIndex((f) => f.id === field.id)) return "source-after";
  if (operatorNeedsValue(condition.operator) && !valuesFor(fields[sourceIndex]).includes(condition.value)) {
    return "missing-value";
  }
  return null;
}

export function evaluateCondition(condition: Condition, value: string | undefined): boolean {
  const v = (value ?? "").trim();
  switch (condition.operator) {
    case "equals":
      return v === condition.value;
    case "not_equals":
      return v !== condition.value;
    case "is_answered":
      return v !== "";
    case "is_empty":
      return v === "";
  }
}

/**
 * Ids of the fields a respondent currently sees. Walks fields in order so
 * chains work: an answer to a hidden field counts as empty. Rules that point
 * forward or at a deleted field are ignored (the field stays visible) rather
 * than hiding questions unpredictably.
 */
export function computeVisibility(form: FormDefinitionLike, answers: Answers): Set<string> {
  const visible = new Set<string>();
  const seen = new Set<string>();

  for (const field of allFields(form)) {
    const c = field.condition;
    const sourceUsable = c && seen.has(c.fieldId);
    if (!c || !sourceUsable) {
      visible.add(field.id);
    } else {
      const value = visible.has(c.fieldId) ? answers[c.fieldId] : "";
      if (evaluateCondition(c, value)) visible.add(field.id);
    }
    seen.add(field.id);
  }
  return visible;
}

/** Steps that have at least one visible field. Empty steps are skipped. */
export function activeSteps(form: FormDefinitionLike, visible: Set<string>): Step[] {
  return form.steps.filter((s) => s.fields.some((f) => visible.has(f.id)));
}

/** Short human description, e.g. `City is "Bengaluru"`. */
export function describeCondition(form: FormDefinitionLike, condition: Condition): string {
  const source = allFields(form).find((f) => f.id === condition.fieldId);
  const name = source?.label.trim() || "a deleted question";
  const op = OPERATOR_LABELS[condition.operator];
  if (!operatorNeedsValue(condition.operator)) return `${name} ${op}`;
  const value = source?.type === "rating" ? `${condition.value}★` : `“${condition.value}”`;
  return `${name} ${op} ${value}`;
}

/** Fields whose rules use `fieldId` as their source. */
export function dependentsOf(form: FormDefinitionLike, fieldId: string): Field[] {
  return allFields(form).filter((f) => f.condition?.fieldId === fieldId);
}
