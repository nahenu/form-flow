import { describe, expect, it } from "vitest";
import { addField, duplicateField, moveField, removeField, removeStep } from "./operations";
import { field, makeForm, step } from "./test-utils";

const ids = (form: ReturnType<typeof makeForm>) => form.steps.map((s) => s.fields.map((f) => f.id));

function sample() {
  return makeForm([
    step("s1", [field("a", "dropdown", { options: ["x"] }), field("b", "short_text")]),
    step("s2", [field("c", "short_text", { condition: { fieldId: "a", operator: "equals", value: "x" } })]),
  ]);
}

describe("moveField", () => {
  it("reorders within a step", () => {
    const form = sample();
    moveField(form, "a", "s1", 1);
    expect(ids(form)).toEqual([["b", "a"], ["c"]]);
  });

  it("moves across steps and clamps the index", () => {
    const form = sample();
    moveField(form, "b", "s2", 99);
    expect(ids(form)).toEqual([["a"], ["c", "b"]]);
  });
});

describe("addField / duplicateField", () => {
  it("inserts at an index", () => {
    const form = sample();
    const id = addField(form, "s1", "email", 1);
    expect(ids(form)[0]).toEqual(["a", id, "b"]);
  });

  it("duplicates right after the original with a new id", () => {
    const form = sample();
    const copy = duplicateField(form, "b");
    expect(copy).not.toBe("b");
    expect(ids(form)[0]).toEqual(["a", "b", copy]);
  });
});

describe("removing sources cleans up rules", () => {
  it("removeField drops rules that used the field", () => {
    const form = sample();
    expect(removeField(form, "a")).toBe(1);
    expect(form.steps[1].fields[0].condition).toBeUndefined();
  });

  it("removeStep drops rules that used any of its fields", () => {
    const form = sample();
    expect(removeStep(form, "s1")).toBe(1);
    expect(form.steps[0].fields[0].condition).toBeUndefined();
  });

  it("never removes the last step", () => {
    const form = makeForm([step("only", [])]);
    removeStep(form, "only");
    expect(form.steps).toHaveLength(1);
  });
});
