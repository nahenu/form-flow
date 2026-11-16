import { expect, test, type Page } from "@playwright/test";
import { createLeadForm, signUp } from "./helpers";

const edgeLabels = (page: Page) => page.locator(".react-flow__edgelabel-renderer div").allInnerTexts();

test("the flow editor draws routes, adds one by dragging, and the preview follows it", async ({ page }) => {
  await signUp(page, "Flow Tester");
  await createLeadForm(page);

  await page.getByRole("tab", { name: /Flow/ }).click();
  await expect(page.locator(".react-flow__node-step")).toHaveCount(4);
  await expect.poll(() => edgeLabels(page)).toContain("If Which city is the property in? is “Bengaluru”");

  // Drag from step 1's route handle (right side) to the End node.
  const handle = page.locator(".react-flow__node-step").first().locator(".react-flow__handle[data-handleid=route]");
  const end = page.locator(".react-flow__node-terminal").filter({ hasText: "End" });
  const from = (await handle.boundingBox())!;
  const to = (await end.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + 5, { steps: 20 });
  await page.mouse.up();

  const panel = page.getByRole("complementary", { name: "Flow settings" });
  await expect(panel.getByRole("heading", { name: "Route" })).toBeVisible();
  await panel.getByLabel("Question to test").selectOption({ label: "Step 1 · Phone number" });
  await expect(panel.getByLabel("Comparison")).toHaveValue("is_answered");
  await expect(panel.getByLabel("Go to")).toHaveValue("end");
  await expect.poll(() => edgeLabels(page)).toContain("If Phone number is answered");

  // The preview follows the route: answering the phone ends the form after step 1.
  await page.getByRole("tab", { name: /Preview/ }).click();
  await page.getByLabel("Full name").fill("Kabir");
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeVisible();
  await page.getByLabel("Phone number").fill("9876543210");
  await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();

  // Undo removes the route; the form goes back to four steps.
  await page.getByRole("tab", { name: /Flow/ }).click();
  await page.keyboard.press("Control+z");
  await expect.poll(() => edgeLabels(page)).not.toContain("If Phone number is answered");
});

test("flows only go forward: dragging to an earlier step is refused", async ({ page }) => {
  await signUp(page);
  await createLeadForm(page);
  await page.getByRole("tab", { name: /Flow/ }).click();
  // Wait for the graph to draw before counting its routes.
  await expect.poll(() => edgeLabels(page)).toContain("If Which city is the property in? is “Bengaluru”");
  const before = (await edgeLabels(page)).length;

  const handle = page.locator(".react-flow__node-step").nth(2).locator(".react-flow__handle[data-handleid=route]");
  const firstStep = page.locator(".react-flow__node-step").first();
  const from = (await handle.boundingBox())!;
  const to = (await firstStep.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + 4, { steps: 20 });
  await page.mouse.up();

  await expect.poll(async () => (await edgeLabels(page)).length).toBe(before);
});
