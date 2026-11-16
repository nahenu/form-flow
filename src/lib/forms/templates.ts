import { createField, createStep, newId } from "./operations";
import type { Form } from "./types";

export type TemplateId = "blank" | "lead";

export function formFromTemplate(template: TemplateId): Form {
  const now = Date.now();
  const base = { id: newId(), createdAt: now, updatedAt: now };

  if (template === "lead") {
    return {
      ...base,
      title: "Interior design enquiry",
      steps: [
        createStep("About you", [
          createField("short_text", { label: "Full name", placeholder: "Your name", required: true }),
          createField("phone", { label: "Phone number", required: true, helpText: "We'll send a one-time code to verify it." }),
        ]),
        createStep("Your home", [
          createField("dropdown", {
            label: "Which city is the property in?",
            placeholder: "Choose a city",
            options: ["Bengaluru", "Mumbai", "Delhi NCR", "Hyderabad", "Pune", "Chennai"],
            required: true,
          }),
          createField("multiple_choice", {
            label: "What's the property type?",
            options: ["1 BHK", "2 BHK", "3 BHK", "4+ BHK / Villa"],
            required: true,
          }),
        ]),
        createStep("Almost done", [
          createField("email", { label: "Email address", required: true }),
          createField("date", { label: "When do you want to move in?" }),
        ]),
      ],
    };
  }

  return {
    ...base,
    title: "Untitled form",
    steps: [createStep("Step 1", [createField("short_text", { label: "Full name", placeholder: "Your name" })])],
  };
}
