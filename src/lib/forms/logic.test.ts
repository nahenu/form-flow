import { describe, expect, it } from "vitest";
import {
  resolveFlow,
  computeVisibility,
  conditionProblem,
  defaultCondition,
  describeCondition,
  evaluateCondition,
  operatorsFor,
} from "./logic";
import { field, makeForm, step } from "./test-utils";

const CITIES = ["Bengaluru", "Mumbai"];

function leadForm() {
  return makeForm([
    step("s1", [field("city", "dropdown", { options: CITIES })]),
    step("s2", [field("studio", "multiple_choice", { condition: { fieldId: "city", operator: "equals", value: "Bengaluru" } })]),
    step("s3", [field("email", "email")]),
  ]);
}

describe("evaluateCondition", () => {
  it.each([
    ["equals", "Bengaluru", "Bengaluru", true],
    ["equals", "Bengaluru", "Mumbai", false],
    ["not_equals", "Bengaluru", "Mumbai", true],
    ["not_equals", "Bengaluru", "", true],
    ["is_answered", "", "  ", false],
    ["is_answered", "", "x", true],
    ["is_empty", "", undefined, true],
  ] as const)("%s %j against %j → %s", (operator, value, answer, expected) => {
    expect(evaluateCondition({ fieldId: "a", operator, value }, answer)).toBe(expected);
  });
});

describe("computeVisibility", () => {
  it("shows a field only when its rule matches", () => {
    const form = leadForm();
    expect(computeVisibility(form, {}).has("studio")).toBe(false);
    expect(computeVisibility(form, { city: "Mumbai" }).has("studio")).toBe(false);
    expect(computeVisibility(form, { city: "Bengaluru" }).has("studio")).toBe(true);
  });

  it("skips a step whose fields are all hidden", () => {
    const form = leadForm();
    const ids = (answers: Record<string, string>) => resolveFlow(form, answers).path.map((s) => s.id);
    expect(ids({ city: "Mumbai" })).toEqual(["s1", "s3"]);
    expect(ids({ city: "Bengaluru" })).toEqual(["s1", "s2", "s3"]);
  });

  it("treats answers to hidden fields as empty, so chains collapse", () => {
    const form = makeForm([
      step("s1", [
        field("a", "dropdown", { options: ["yes", "no"] }),
        field("b", "dropdown", { options: ["yes", "no"], condition: { fieldId: "a", operator: "equals", value: "yes" } }),
        field("c", "short_text", { condition: { fieldId: "b", operator: "equals", value: "yes" } }),
      ]),
    ]);
    // b was answered "yes" earlier, but a changed to "no", so b hides and c must hide too.
    const visible = computeVisibility(form, { a: "no", b: "yes" });
    expect([...visible]).toEqual(["a"]);
  });

  it("ignores rules that point forward or at a deleted field instead of hiding things", () => {
    const form = makeForm([
      step("s1", [
        field("early", "short_text", { condition: { fieldId: "late", operator: "is_answered", value: "" } }),
        field("orphan", "short_text", { condition: { fieldId: "gone", operator: "is_answered", value: "" } }),
        field("late", "short_text"),
      ]),
    ]);
    expect(computeVisibility(form, {})).toEqual(new Set(["early", "orphan", "late"]));
  });
});

describe("conditionProblem", () => {
  it("is null for a valid rule", () => {
    const form = leadForm();
    expect(conditionProblem(form, form.steps[1].fields[0])).toBeNull();
  });

  it("flags a source that has moved below", () => {
    const form = leadForm();
    form.steps.reverse();
    expect(conditionProblem(form, form.steps[1].fields[0])).toBe("source-after");
  });

  it("flags a value that is no longer an option", () => {
    const form = leadForm();
    form.steps[0].fields[0].options = ["Mumbai"];
    expect(conditionProblem(form, form.steps[1].fields[0])).toBe("missing-value");
  });

  it("flags a deleted source", () => {
    const form = leadForm();
    form.steps[0].fields = [];
    expect(conditionProblem(form, form.steps[1].fields[0])).toBe("missing-source");
  });
});

describe("rule helpers", () => {
  it("defaults to the nearest earlier choice question", () => {
    const form = makeForm([
      step("s1", [field("choice", "dropdown", { options: ["x", "y"] }), field("text", "short_text"), field("target", "email")]),
    ]);
    expect(defaultCondition(form, "target")).toEqual({ fieldId: "choice", operator: "equals", value: "x" });
    expect(defaultCondition(form, "choice")).toBeNull();
  });

  it("only offers value comparisons for fields with fixed answers", () => {
    expect(operatorsFor("short_text")).toEqual(["is_answered", "is_empty"]);
    expect(operatorsFor("rating")).toContain("equals");
  });

  it("describes rules in plain language", () => {
    const form = leadForm();
    expect(describeCondition(form, form.steps[1].fields[0].condition!)).toBe("city is “Bengaluru”");
  });
});
