import {
  AlignLeft,
  AtSign,
  Calendar,
  ChevronsUpDown,
  Hash,
  ListChecks,
  Phone,
  Star,
  Type,
  type LucideIcon,
} from "lucide-react";
import type { Field, FieldType } from "./types";

export type FieldGroup = "Basic" | "Contact" | "Choice" | "Other";

interface FieldTypeMeta {
  label: string;
  icon: LucideIcon;
  group: FieldGroup;
  /** Whether the field shows a placeholder input in the inspector. */
  hasPlaceholder: boolean;
  hasOptions: boolean;
  defaults: Pick<Field, "label" | "placeholder" | "options">;
}

export const FIELD_TYPES: Record<FieldType, FieldTypeMeta> = {
  short_text: {
    label: "Short text",
    icon: Type,
    group: "Basic",
    hasPlaceholder: true,
    hasOptions: false,
    defaults: { label: "Short answer", placeholder: "Type your answer", options: [] },
  },
  long_text: {
    label: "Long text",
    icon: AlignLeft,
    group: "Basic",
    hasPlaceholder: true,
    hasOptions: false,
    defaults: { label: "Tell us more", placeholder: "A few sentences is fine", options: [] },
  },
  number: {
    label: "Number",
    icon: Hash,
    group: "Basic",
    hasPlaceholder: true,
    hasOptions: false,
    defaults: { label: "How many?", placeholder: "0", options: [] },
  },
  email: {
    label: "Email",
    icon: AtSign,
    group: "Contact",
    hasPlaceholder: true,
    hasOptions: false,
    defaults: { label: "Email address", placeholder: "you@company.com", options: [] },
  },
  phone: {
    label: "Phone",
    icon: Phone,
    group: "Contact",
    hasPlaceholder: true,
    hasOptions: false,
    defaults: { label: "Phone number", placeholder: "+91 98765 43210", options: [] },
  },
  multiple_choice: {
    label: "Multiple choice",
    icon: ListChecks,
    group: "Choice",
    hasPlaceholder: false,
    hasOptions: true,
    defaults: { label: "Pick one", placeholder: "", options: ["Option 1", "Option 2", "Option 3"] },
  },
  dropdown: {
    label: "Dropdown",
    icon: ChevronsUpDown,
    group: "Choice",
    hasPlaceholder: true,
    hasOptions: true,
    defaults: { label: "Choose one", placeholder: "Select an option", options: ["Option 1", "Option 2", "Option 3"] },
  },
  date: {
    label: "Date",
    icon: Calendar,
    group: "Other",
    hasPlaceholder: false,
    hasOptions: false,
    defaults: { label: "Pick a date", placeholder: "", options: [] },
  },
  rating: {
    label: "Rating",
    icon: Star,
    group: "Other",
    hasPlaceholder: false,
    hasOptions: false,
    defaults: { label: "How would you rate us?", placeholder: "", options: [] },
  },
};

export const FIELD_GROUPS: FieldGroup[] = ["Basic", "Contact", "Choice", "Other"];

export function fieldTypesIn(group: FieldGroup): FieldType[] {
  return (Object.keys(FIELD_TYPES) as FieldType[]).filter((t) => FIELD_TYPES[t].group === group);
}
