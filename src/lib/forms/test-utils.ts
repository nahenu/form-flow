import { createField, createStep } from "./operations";
import type { Field, FieldType, Form, Step } from "./types";

/** Build a form from a compact description for tests. */
export function makeForm(steps: Step[]): Form {
  return { id: "form", title: "Test", steps, createdAt: 0, updatedAt: 0 };
}

export function field(id: string, type: FieldType, overrides: Partial<Field> = {}): Field {
  return createField(type, { id, label: id, ...overrides });
}

export function step(id: string, fields: Field[]): Step {
  return { ...createStep(id, fields), id };
}
