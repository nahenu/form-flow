import { describe, expect, it } from "vitest";
import { stableStringify } from "@/lib/stable-json";
import { field, makeForm, step } from "./test-utils";
import { validateField, validateSubmission } from "./validation";

const form = makeForm([
  step("s1", [
    field("name", "short_text", { required: true }),
    field("city", "dropdown", { options: ["Bengaluru", "Mumbai"], required: true }),
  ]),
  step("s2", [
    field("studio", "multiple_choice", {
      options: ["HSR", "Whitefield"],
      required: true,
      condition: { fieldId: "city", operator: "equals", value: "Bengaluru" },
    }),
    field("email", "email"),
  ]),
]);

describe("validateField", () => {
  it.each([
    ["email", "a@b.co", null],
    ["email", "nope", "That doesn't look like an email address."],
    ["phone", "+91 98765 43210", null],
    ["phone", "12345", "Enter at least 10 digits."],
    ["rating", "6", "Pick a rating."],
    ["date", "2026-11-16", null],
    ["date", "16/11/2026", "Pick a date."],
  ] as const)("%s %j", (type, value, expected) => {
    expect(validateField(field("f", type), value)).toBe(expected);
  });

  it("only accepts listed options for choice fields", () => {
    const f = field("f", "dropdown", { options: ["A", "B"] });
    expect(validateField(f, "A")).toBeNull();
    expect(validateField(f, "<script>")).toBe("Pick one of the options.");
  });
});

describe("validateSubmission", () => {
  it("requires visible required fields only", () => {
    const result = validateSubmission(form, { name: "Asha", city: "Mumbai" });
    expect(result).toEqual({ ok: true, answers: { name: "Asha", city: "Mumbai" } });
  });

  it("enforces fields that a rule made visible", () => {
    const result = validateSubmission(form, { name: "Asha", city: "Bengaluru" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors)).toEqual(["studio"]);
  });

  it("drops answers to hidden and unknown fields", () => {
    const result = validateSubmission(form, { name: "Asha", city: "Mumbai", studio: "HSR", injected: "x" });
    expect(result).toEqual({ ok: true, answers: { name: "Asha", city: "Mumbai" } });
  });

  it("trims and omits empty optional answers", () => {
    const result = validateSubmission(form, { name: "  Asha ", city: "Mumbai", email: "   " });
    expect(result).toEqual({ ok: true, answers: { name: "Asha", city: "Mumbai" } });
  });
});

describe("stableStringify", () => {
  it("ignores key order, as Postgres jsonb reorders keys", () => {
    expect(stableStringify({ b: 1, a: { d: [1, { y: 1, x: 2 }], c: 2 } })).toBe(
      stableStringify({ a: { c: 2, d: [1, { x: 2, y: 1 }] }, b: 1 }),
    );
  });

  it("keeps array order", () => {
    expect(stableStringify([1, 2])).not.toBe(stableStringify([2, 1]));
  });
});
