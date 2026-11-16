import { expect, test, type Page } from "@playwright/test";
import { createLeadForm, signUp } from "./helpers";

const horizontalOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

test("landing page fits a phone", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await horizontalOverflow(page)).toBe(0);
});

test("builder works on a phone: field strip and settings sheet", async ({ page }) => {
  await signUp(page);
  await createLeadForm(page);
  expect(await horizontalOverflow(page)).toBe(0);

  // Palette becomes a strip of buttons; settings slide up as a sheet.
  await page.getByRole("button", { name: "Date", exact: true }).click();
  const sheet = page.getByRole("complementary", { name: "Field settings" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByLabel("Question", { exact: true })).toHaveValue("Pick a date");
  await sheet.getByRole("button", { name: "Close field settings" }).click();
  await expect(sheet).toBeHidden();
});
