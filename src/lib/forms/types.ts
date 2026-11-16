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

export interface Step {
  id: string;
  title: string;
  fields: Field[];
}

export interface Form {
  id: string;
  title: string;
  steps: Step[];
  createdAt: number;
  updatedAt: number;
}
