import { createField, createStep, newId } from "./operations";
import type { Form, Step } from "./types";

/** The lead template shows off branching: Bengaluru visitors get a studio step, everyone else a video-call question. */
function leadSteps(): Step[] {
  const city = createField("dropdown", {
    label: "Which city is the property in?",
    placeholder: "Choose a city",
    options: ["Bengaluru", "Mumbai", "Delhi NCR", "Hyderabad", "Pune", "Chennai"],
    required: true,
  });

  return [
    createStep("About you", [
      createField("short_text", { label: "Full name", placeholder: "Your name", required: true }),
      createField("phone", { label: "Phone number", required: true, helpText: "We'll send a one-time code to verify it." }),
    ]),
    createStep("Your home", [
      city,
      createField("multiple_choice", {
        label: "What's the property type?",
        options: ["1 BHK", "2 BHK", "3 BHK", "4+ BHK / Villa"],
        required: true,
      }),
      createField("multiple_choice", {
        label: "Would a video consultation work for you?",
        options: ["Yes, a video call is great", "No, I'd rather meet in person"],
        condition: { fieldId: city.id, operator: "not_equals", value: "Bengaluru" },
      }),
    ]),
    createStep("Visit a studio", [
      createField("multiple_choice", {
        label: "Which studio is closest to you?",
        options: ["Indiranagar", "HSR Layout", "Whitefield"],
        required: true,
        helpText: "Our designers will meet you there with material samples.",
        condition: { fieldId: city.id, operator: "equals", value: "Bengaluru" },
      }),
    ]),
    createStep("Almost done", [
      createField("email", { label: "Email address", required: true }),
      createField("date", { label: "When do you want to move in?" }),
    ]),
  ];
}

export type TemplateId = "blank" | "lead";

export function formFromTemplate(template: TemplateId): Form {
  const now = Date.now();
  const base = { id: newId(), createdAt: now, updatedAt: now };

  if (template === "lead") {
    return {
      ...base,
      title: "Interior design enquiry",
      steps: leadSteps(),
    };
  }

  return {
    ...base,
    title: "Untitled form",
    steps: [createStep("Step 1", [createField("short_text", { label: "Full name", placeholder: "Your name" })])],
  };
}
