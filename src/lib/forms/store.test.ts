import { beforeEach, describe, expect, it } from "vitest";
import { useFormsStore } from "./store";
import { makeForm, field, step } from "./test-utils";

const store = () => useFormsStore.getState();

beforeEach(() => {
  store().unload("form");
  store().load(makeForm([step("s1", [field("a", "short_text")])]));
});

describe("forms store history", () => {
  it("records an undo step for a real change", () => {
    store().edit("form", (d) => void (d.title = "New"));
    expect(store().history.form.past).toHaveLength(1);
    store().undo("form");
    expect(store().forms.form.title).toBe("Test");
  });

  it("ignores edits that change nothing", () => {
    store().edit("form", (d) => void (d.title = "Test"));
    expect(store().history.form.past).toHaveLength(0);
  });

  it("groups rapid edits with the same key into one undo step", () => {
    store().edit("form", (d) => void (d.title = "N"), "title");
    store().edit("form", (d) => void (d.title = "Ne"), "title");
    store().edit("form", (d) => void (d.title = "New"), "title");
    expect(store().history.form.past).toHaveLength(1);
    store().undo("form");
    expect(store().forms.form.title).toBe("Test");
    store().redo("form");
    expect(store().forms.form.title).toBe("New");
  });
});
