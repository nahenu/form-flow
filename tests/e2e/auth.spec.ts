import { expect, test } from "@playwright/test";
import { PASSWORD, signUp } from "./helpers";

test("protected pages send signed-out visitors to sign in, keeping where they were going", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fdashboard$/);
});

test("sign up, sign out, and sign back in", async ({ page }) => {
  const { email } = await signUp(page, "Asha Rao");
  await expect(page.getByText("No forms yet")).toBeVisible();

  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/sign-in?next=/dashboard");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("form [role=alert]")).toHaveText("That email and password don't match.");
  // Regression: credentials must never end up in the URL.
  expect(page.url()).not.toContain("password");

  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("signed-in visitors skip the auth pages", async ({ page }) => {
  await signUp(page);
  await page.goto("/sign-in");
  await expect(page).toHaveURL(/\/dashboard$/);
});
