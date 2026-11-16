export type FieldType =
  | "short_text"
  | "long_text"
  | "email"
  | "phone"
  | "number"
  | "dropdown"
  | "multiple_choice"
  | "date"
  | "rating";

export type ConditionOperator = "equals" | "not_equals" | "is_answered" | "is_empty";

/** "Show this field only if <fieldId> <operator> <value>". */
export interface Condition {
  fieldId: string;
  operator: ConditionOperator;
  /** Only used by equals / not_equals. */
  value: string;
}

export interface Field {
  id: string;
  type: FieldType;
  label: string;
  placeholder: string;
  helpText: string;
  required: boolean;
  /** Only used by dropdown and multiple_choice. */
  options: string[];
  /** Optional visibility rule. Forms saved before logic existed simply don't have it. */
  condition?: Condition;
}

/** Where a route or a step's default path goes: another step's id, or the end of the form. */
export type StepTarget = string;
export const END = "end";

/** "When <condition>, jump to <to>". Checked in order after the step is completed; the first match wins. */
export interface Route {
  id: string;
  condition: Condition;
  to: StepTarget;
}

export interface Step {
  id: string;
  title: string;
  fields: Field[];
  /** Conditional jumps. Forms saved before the flow editor existed simply don't have them. */
  routes?: Route[];
  /** Where to go when no route matches. Missing means the next step in order. */
  next?: StepTarget;
  /** Card position in the flow editor. Missing means automatic layout. */
  position?: { x: number; y: number };
}

export interface Form {
  id: string;
  title: string;
  steps: Step[];
  createdAt: number;
  updatedAt: number;
}

/** Anything with steps: a full Form, a saved definition, or a published snapshot. */
export type FormDefinitionLike = Pick<Form, "steps">;
