/**
 * Pure mutations on a Form draft. The store clones the form before calling
 * these, so they can mutate freely and stay trivially testable.
 */
import { FIELD_TYPES } from "./field-types";
import type { Condition, Field, FieldType, Form, Route, Step, StepTarget } from "./types";

export const newId = () => crypto.randomUUID().slice(0, 8);

export function createField(type: FieldType, overrides: Partial<Field> = {}): Field {
  const { defaults } = FIELD_TYPES[type];
  return {
    id: newId(),
    type,
    label: defaults.label,
    placeholder: defaults.placeholder,
    helpText: "",
    required: false,
    options: [...defaults.options],
    ...overrides,
  };
}

export function createStep(title: string, fields: Field[] = []): Step {
  return { id: newId(), title, fields };
}

export function findField(form: Form, fieldId: string) {
  for (const step of form.steps) {
    const index = step.fields.findIndex((f) => f.id === fieldId);
    if (index !== -1) return { step, index, field: step.fields[index] };
  }
  return null;
}

export function addField(form: Form, stepId: string, type: FieldType, index?: number): string | null {
  const step = form.steps.find((s) => s.id === stepId);
  if (!step) return null;
  const field = createField(type);
  step.fields.splice(index ?? step.fields.length, 0, field);
  return field.id;
}

export function updateField(form: Form, fieldId: string, patch: Partial<Omit<Field, "id">>) {
  const hit = findField(form, fieldId);
  if (hit) Object.assign(hit.field, patch);
}

/** Drop field rules and routes whose source no longer exists. Returns how many were removed. */
function clearConditionsTo(form: Form, removedIds: Set<string>): number {
  let cleared = 0;
  for (const step of form.steps) {
    for (const field of step.fields) {
      if (field.condition && removedIds.has(field.condition.fieldId)) {
        delete field.condition;
        cleared++;
      }
    }
    if (step.routes) {
      const kept = step.routes.filter((r) => !removedIds.has(r.condition.fieldId));
      cleared += step.routes.length - kept.length;
      step.routes = kept;
    }
  }
  return cleared;
}

/** Removes the field and any rules that depended on it. Returns the number of rules removed. */
export function removeField(form: Form, fieldId: string): number {
  const hit = findField(form, fieldId);
  if (!hit) return 0;
  hit.step.fields.splice(hit.index, 1);
  return clearConditionsTo(form, new Set([fieldId]));
}

export function duplicateField(form: Form, fieldId: string): string | null {
  const hit = findField(form, fieldId);
  if (!hit) return null;
  const copy = { ...structuredClone(hit.field), id: newId(), label: `${hit.field.label} (copy)` };
  hit.step.fields.splice(hit.index + 1, 0, copy);
  return copy.id;
}

/** Move a field to `toStepId` so it ends up at `toIndex` in that step. */
export function moveField(form: Form, fieldId: string, toStepId: string, toIndex: number) {
  const hit = findField(form, fieldId);
  const target = form.steps.find((s) => s.id === toStepId);
  if (!hit || !target) return;
  const [field] = hit.step.fields.splice(hit.index, 1);
  const clamped = Math.max(0, Math.min(toIndex, target.fields.length));
  target.fields.splice(clamped, 0, field);
}

export function addStep(form: Form): string {
  const step = createStep(`Step ${form.steps.length + 1}`);
  form.steps.push(step);
  return step.id;
}

export function renameStep(form: Form, stepId: string, title: string) {
  const step = form.steps.find((s) => s.id === stepId);
  if (step) step.title = title;
}

/**
 * Removes the step, rules and routes that tested its fields, and routes that
 * led to it. A default path that led to it falls back to "next in order".
 */
export function removeStep(form: Form, stepId: string): number {
  const step = form.steps.find((s) => s.id === stepId);
  if (!step || form.steps.length <= 1) return 0;
  form.steps = form.steps.filter((s) => s.id !== stepId);
  let cleared = clearConditionsTo(form, new Set(step.fields.map((f) => f.id)));
  for (const s of form.steps) {
    if (s.next === stepId) delete s.next;
    if (s.routes) {
      const kept = s.routes.filter((r) => r.to !== stepId);
      cleared += s.routes.length - kept.length;
      s.routes = kept;
    }
  }
  return cleared;
}

// ---- flow: routes, default paths and card positions ------------------------

export function addRoute(form: Form, stepId: string, condition: Condition, to: StepTarget): string | null {
  const step = form.steps.find((s) => s.id === stepId);
  if (!step) return null;
  const route: Route = { id: newId(), condition, to };
  (step.routes ??= []).push(route);
  return route.id;
}

export function updateRoute(form: Form, stepId: string, routeId: string, patch: Partial<Omit<Route, "id">>) {
  const route = form.steps.find((s) => s.id === stepId)?.routes?.find((r) => r.id === routeId);
  if (route) Object.assign(route, patch);
}

export function removeRoute(form: Form, stepId: string, routeId: string) {
  const step = form.steps.find((s) => s.id === stepId);
  if (step?.routes) step.routes = step.routes.filter((r) => r.id !== routeId);
}

/** Set where a step goes when no route matches; `undefined` means "next step in order". */
export function setStepNext(form: Form, stepId: string, to: StepTarget | undefined) {
  const step = form.steps.find((s) => s.id === stepId);
  if (!step) return;
  if (to === undefined) delete step.next;
  else step.next = to;
}

export function setStepPositions(form: Form, positions: Record<string, { x: number; y: number }>) {
  for (const step of form.steps) {
    const p = positions[step.id];
    if (p) step.position = { x: Math.round(p.x), y: Math.round(p.y) };
  }
}

export function clearStepPositions(form: Form) {
  for (const step of form.steps) delete step.position;
}

export function countFields(form: Form) {
  return form.steps.reduce((n, s) => n + s.fields.length, 0);
}
