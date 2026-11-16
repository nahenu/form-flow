/**
 * Conditional logic: which fields (and therefore which steps) a respondent sees,
 * given their answers so far. Everything here is pure so it can be unit tested
 * and shared by the builder, the preview and, later, the public form.
 */
import { END, type Condition, type ConditionOperator, type Field, type FieldType, type FormDefinitionLike, type Route, type Step, type StepTarget } from "./types";

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

export interface FlowResult {
  /** The steps this respondent goes through, in order (steps with nothing to show are skipped). */
  path: Step[];
  /** Ids of the fields they see. */
  visible: Set<string>;
}

/** Position of every field in form order, for "does this rule look backwards?" checks. */
function fieldPositions(form: FormDefinitionLike) {
  const pos = new Map<string, number>();
  allFields(form).forEach((f, i) => pos.set(f.id, i));
  return pos;
}

/** Index of the last field in or before step `stepIndex` (-1 if none). */
function lastFieldPosUpTo(form: FormDefinitionLike, stepIndex: number) {
  return form.steps.slice(0, stepIndex + 1).reduce((n, s) => n + s.fields.length, 0) - 1;
}

/** Is `to` a valid jump from step `from`? Only forward, to an existing step, or to the end. */
export function isForwardTarget(form: FormDefinitionLike, from: number, to: StepTarget | undefined): to is StepTarget {
  if (!to) return false;
  if (to === END) return true;
  return form.steps.findIndex((s) => s.id === to) > from;
}

/** Where step `index` goes when no route matches: its own `next` if valid, else the following step. */
export function defaultTarget(form: FormDefinitionLike, index: number): StepTarget {
  const step = form.steps[index];
  if (isForwardTarget(form, index, step.next)) return step.next;
  return form.steps[index + 1]?.id ?? END;
}

/**
 * The heart of the form logic: walk the steps from the start, showing fields
 * whose rules pass and following routes, and return the path and visible
 * fields. The builder preview, the public form and server-side validation
 * all use this, so they can never disagree.
 *
 * - An answer to a hidden field, or to a field in a step that was skipped,
 *   counts as empty, so chains collapse.
 * - Rules and routes that point forward, at a deleted field, or (routes) to an
 *   earlier step are ignored rather than doing something surprising.
 * - Routes only go forward, so the walk always ends.
 */
export function resolveFlow(form: FormDefinitionLike, answers: Answers): FlowResult {
  const visible = new Set<string>();
  const path: Step[] = [];
  const pos = fieldPositions(form);
  const valueOf = (fieldId: string) => (visible.has(fieldId) ? answers[fieldId] : "");

  let index = 0;
  while (index < form.steps.length) {
    const step = form.steps[index];

    for (const field of step.fields) {
      const c = field.condition;
      const sourcePos = c ? pos.get(c.fieldId) : undefined;
      const ruleApplies = c && sourcePos !== undefined && sourcePos < pos.get(field.id)!;
      if (!ruleApplies || evaluateCondition(c, valueOf(c.fieldId))) visible.add(field.id);
    }
    if (step.fields.some((f) => visible.has(f.id))) path.push(step);

    const limit = lastFieldPosUpTo(form, index);
    const route = (step.routes ?? []).find((r) => {
      const sourcePos = pos.get(r.condition.fieldId);
      return (
        isForwardTarget(form, index, r.to) &&
        sourcePos !== undefined &&
        sourcePos <= limit &&
        evaluateCondition(r.condition, valueOf(r.condition.fieldId))
      );
    });
    const target = route ? route.to : defaultTarget(form, index);
    if (target === END) break;
    index = form.steps.findIndex((s) => s.id === target);
  }

  return { path, visible };
}

/** Ids of the fields a respondent currently sees. */
export function computeVisibility(form: FormDefinitionLike, answers: Answers): Set<string> {
  return resolveFlow(form, answers).visible;
}

// ---- routes (flow editor) -------------------------------------------------

/** Fields a route on step `stepIndex` may test: that step's own fields and everything before. */
export function fieldsUpToStep(form: FormDefinitionLike, stepIndex: number): Field[] {
  return form.steps.slice(0, stepIndex + 1).flatMap((s) => s.fields);
}

/** A sensible first condition for a new route from step `stepIndex`. */
export function defaultRouteCondition(form: FormDefinitionLike, stepIndex: number): Condition | null {
  const candidates = fieldsUpToStep(form, stepIndex);
  if (!candidates.length) return null;
  const source = [...candidates].reverse().find((f) => valuesFor(f).length > 0) ?? candidates[candidates.length - 1];
  return conditionForSource(source);
}

export type RouteProblem = ConditionProblem | "bad-target";

export function routeProblem(form: FormDefinitionLike, stepIndex: number, route: Route): RouteProblem | null {
  if (!isForwardTarget(form, stepIndex, route.to)) return "bad-target";
  const fields = allFields(form);
  const source = fields.find((f) => f.id === route.condition.fieldId);
  if (!source) return "missing-source";
  if (fields.indexOf(source) > lastFieldPosUpTo(form, stepIndex)) return "source-after";
  if (operatorNeedsValue(route.condition.operator) && !valuesFor(source).includes(route.condition.value)) return "missing-value";
  return null;
}

/** Steps whose routes test `fieldId`. */
export function routesUsing(form: FormDefinitionLike, fieldId: string): Step[] {
  return form.steps.filter((s) => s.routes?.some((r) => r.condition.fieldId === fieldId));
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
