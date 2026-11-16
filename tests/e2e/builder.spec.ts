import { expect, test, type Page } from "@playwright/test";
import { createLeadForm, signUp, waitForSave } from "./helpers";

const fieldLabels = (page: Page, step: number) =>
  page.getByRole("main").locator("section").nth(step).locator("li[id^='field-'] [data-field-label]").allTextContents();

test.beforeEach(async ({ page }) => {
  await signUp(page, "Builder Tester");
  await createLeadForm(page);
});

test("edits autosave to the server and survive a reload", async ({ page }) => {
  await page.getByLabel("Form title").fill("Kitchen enquiry");
  await waitForSave(page);

  await page.getByRole("button", { name: "Edit field: Full name" }).click();
  await page.getByLabel("Question", { exact: true }).fill("Your full name");
  await waitForSave(page);

  await page.reload();
  await expect(page.getByLabel("Form title")).toHaveValue("Kitchen enquiry");
  await expect(page.getByRole("button", { name: "Edit field: Your full name" })).toBeVisible();
});

test("undo and redo, with typing grouped into one step", async ({ page }) => {
  const title = page.getByLabel("Form title");
  const original = await title.inputValue();
  await title.click();
  await title.press("End");
  await title.pressSequentially(" draft", { delay: 30 });
  await page.getByRole("main").click({ position: { x: 5, y: 5 } });

  await page.keyboard.press("Control+z");
  await expect(title).toHaveValue(original);
  await page.keyboard.press("Control+Shift+z");
  await expect(title).toHaveValue(`${original} draft`);
});

test("adds a field from the palette and opens its settings", async ({ page }) => {
  const before = (await fieldLabels(page, 3)).length;
  await page.getByRole("button", { name: "Add Rating field" }).click();
  await expect(page.getByRole("complementary", { name: "Field settings" }).getByText("Rating", { exact: true })).toBeVisible();
  expect(await fieldLabels(page, 3)).toHaveLength(before + 1);
});

test("reorders a field with the keyboard", async ({ page }) => {
  expect(await fieldLabels(page, 0)).toEqual(["Full name", "Phone number"]);
  // Wait on the screen-reader announcements between keys, as a user would wait for feedback.
  const announcer = page.locator("[id^=DndLiveRegion]");
  await page.getByRole("button", { name: "Reorder Full name" }).focus();
  await page.keyboard.press("Space");
  await expect(announcer).toHaveText("Picked up Full name.");
  await page.keyboard.press("ArrowDown");
  await expect(announcer).toHaveText("Full name is over position 2 in About you.");
  await page.keyboard.press("Space");
  await expect(announcer).toHaveText("Dropped Full name at position 2 in About you.");
  await expect.poll(() => fieldLabels(page, 0)).toEqual(["Phone number", "Full name"]);
});

test("preview applies conditional logic and skips empty steps", async ({ page }) => {
  await page.getByRole("tab", { name: /Preview/ }).click();
  await page.getByLabel("Full name").fill("Meera");
  await page.getByLabel("Phone number").fill("9876543210");
  await page.getByRole("button", { name: "Next", exact: true }).click();

  const city = page.getByLabel("Which city is the property in?");
  const video = page.getByText("Would a video consultation work for you?");

  await city.selectOption("Mumbai");
  await expect(video).toBeVisible();
  await expect(page.getByText("Step 2 of 3")).toBeVisible();

  await city.selectOption("Bengaluru");
  await expect(video).toBeHidden();
  await expect(page.getByText("Step 2 of 4")).toBeVisible();
  await page.getByRole("radio", { name: /3 BHK/ }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Visit a studio" })).toBeVisible();
});
