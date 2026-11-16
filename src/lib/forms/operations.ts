/**
 * Pure mutations on a Form draft. The store clones the form before calling
 * these, so they can mutate freely and stay trivially testable.
 */
import { FIELD_TYPES } from "./field-types";
import type { Field, FieldType, Form, Step } from "./types";

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

export function removeField(form: Form, fieldId: string) {
  const hit = findField(form, fieldId);
  if (hit) hit.step.fields.splice(hit.index, 1);
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

export function removeStep(form: Form, stepId: string) {
  if (form.steps.length <= 1) return;
  form.steps = form.steps.filter((s) => s.id !== stepId);
}

export function countFields(form: Form) {
  return form.steps.reduce((n, s) => n + s.fields.length, 0);
}
