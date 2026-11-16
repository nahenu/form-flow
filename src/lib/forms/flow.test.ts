import { describe, expect, it } from "vitest";
import { defaultTarget, resolveFlow, routeProblem } from "./logic";
import { addRoute, removeField, removeStep, setStepNext } from "./operations";
import { formFromTemplate } from "./templates";
import { field, makeForm, step } from "./test-utils";
import { END } from "./types";

/** a(choice) → b → c → d, with routes added per test. */
function linear() {
  return makeForm([
    step("a", [field("plan", "dropdown", { options: ["basic", "pro"] })]),
    step("b", [field("b1", "short_text")]),
    step("c", [field("c1", "short_text")]),
    step("d", [field("d1", "email")]),
  ]);
}

const pathIds = (form: ReturnType<typeof linear>, answers: Record<string, string>) =>
  resolveFlow(form, answers).path.map((s) => s.id);

describe("resolveFlow routes", () => {
  it("follows steps in order when there are no routes", () => {
    expect(pathIds(linear(), {})).toEqual(["a", "b", "c", "d"]);
  });

  it("jumps when a route matches and falls through when it doesn't", () => {
    const form = linear();
    addRoute(form as never, "a", { fieldId: "plan", operator: "equals", value: "pro" }, "d");
    expect(pathIds(form, { plan: "pro" })).toEqual(["a", "d"]);
    expect(pathIds(form, { plan: "basic" })).toEqual(["a", "b", "c", "d"]);
  });

  it("uses the first matching route", () => {
    const form = linear();
    addRoute(form as never, "a", { fieldId: "plan", operator: "is_answered", value: "" }, "c");
    addRoute(form as never, "a", { fieldId: "plan", operator: "equals", value: "pro" }, "d");
    expect(pathIds(form, { plan: "pro" })).toEqual(["a", "c", "d"]);
  });

  it("can end the form early", () => {
    const form = linear();
    addRoute(form as never, "a", { fieldId: "plan", operator: "equals", value: "basic" }, END);
    expect(pathIds(form, { plan: "basic" })).toEqual(["a"]);
  });

  it("respects a step's default target", () => {
    const form = linear();
    setStepNext(form as never, "a", "c");
    expect(pathIds(form, {})).toEqual(["a", "c", "d"]);
    expect(defaultTarget(form, 0)).toBe("c");
    expect(defaultTarget(form, 3)).toBe(END);
  });

  it("ignores routes that point backwards, so a flow can never loop", () => {
    const form = linear();
    addRoute(form as never, "c", { fieldId: "plan", operator: "is_answered", value: "" }, "a");
    setStepNext(form as never, "d", "b");
    expect(pathIds(form, { plan: "pro" })).toEqual(["a", "b", "c", "d"]);
    expect(routeProblem(form, 2, form.steps[2].routes![0])).toBe("bad-target");
  });

  it("treats answers from skipped steps as empty", () => {
    const form = linear();
    addRoute(form as never, "a", { fieldId: "plan", operator: "equals", value: "pro" }, "c");
    // c1 only shows if b1 (in the skipped step b) was answered.
    form.steps[2].fields[0].condition = { fieldId: "b1", operator: "is_answered", value: "" };
    const flow = resolveFlow(form, { plan: "pro", b1: "stale answer" });
    expect(flow.path.map((s) => s.id)).toEqual(["a", "d"]);
    expect(flow.visible.has("b1")).toBe(false);
  });

  it("flags a route that tests a question from a later step", () => {
    const form = linear();
    addRoute(form as never, "a", { fieldId: "d1", operator: "is_answered", value: "" }, "c");
    expect(routeProblem(form, 0, form.steps[0].routes![0])).toBe("source-after");
    expect(pathIds(form, { d1: "x@y.co" })).toEqual(["a", "b", "c", "d"]);
  });
});

describe("route cleanup", () => {
  it("deleting the tested question deletes its routes", () => {
    const form = linear();
    addRoute(form as never, "a", { fieldId: "plan", operator: "equals", value: "pro" }, "d");
    expect(removeField(form as never, "plan")).toBe(1);
    expect(form.steps[0].routes).toEqual([]);
  });

  it("deleting a target step deletes routes to it and resets default paths", () => {
    const form = linear();
    addRoute(form as never, "a", { fieldId: "plan", operator: "equals", value: "pro" }, "d");
    setStepNext(form as never, "b", "d");
    expect(removeStep(form as never, "d")).toBe(1);
    expect(form.steps[0].routes).toEqual([]);
    expect(form.steps[1].next).toBeUndefined();
  });
});

describe("lead template", () => {
  it("sends Bengaluru to the studio step and everyone else past it", () => {
    const form = formFromTemplate("lead");
    const city = form.steps[1].fields[0].id;
    const titles = (answers: Record<string, string>) => resolveFlow(form, answers).path.map((s) => s.title);
    expect(titles({ [city]: "Bengaluru" })).toEqual(["About you", "Your home", "Visit a studio", "Almost done"]);
    expect(titles({ [city]: "Mumbai" })).toEqual(["About you", "Your home", "Almost done"]);
  });
});
