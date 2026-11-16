import { expect, test } from "@playwright/test";
import { createLeadForm, signUp } from "./helpers";

test("coming back from the builder leaves the dashboard usable (no stuck spinner)", async ({ page }) => {
  await signUp(page);
  await createLeadForm(page);

  // Next keeps the dashboard alive in the background; its buttons must not stay in the loading state.
  await page.goBack();
  await expect(page).toHaveURL(/\/dashboard$/);
  const template = page.getByRole("button", { name: /Lead form template/ });
  const blank = page.getByRole("button", { name: /New form/ });
  await expect(template).toBeEnabled();
  await expect(blank).toBeEnabled();
  await expect(page.locator("main .animate-spin")).toHaveCount(0);

  // And they still work.
  await blank.click();
  await expect(page).toHaveURL(/\/builder\/[A-Za-z0-9]+$/);
});

test("the save indicator explains autosave", async ({ page }) => {
  await signUp(page);
  await createLeadForm(page);
  const status = page.getByText("All changes saved", { exact: true });
  await expect(status).toBeVisible();
  await status.hover();
  await expect(page.getByRole("tooltip")).toContainText("saves automatically");
});
