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

export interface Field {
  id: string;
  type: FieldType;
  label: string;
  placeholder: string;
  helpText: string;
  required: boolean;
  /** Only used by dropdown and multiple_choice. */
  options: string[];
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
