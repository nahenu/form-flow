import { expect, type Browser, type Page } from "@playwright/test";

export const PASSWORD = "e2e-password-123";

export function uniqueEmail(prefix = "user") {
  return `${prefix}+${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/** Creates a fresh account and lands on the dashboard. */
export async function signUp(page: Page, name = "Test User") {
  const email = uniqueEmail(name.split(" ")[0].toLowerCase());
  await page.goto("/sign-up");
  await page.getByLabel("Your name").fill(name);
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  return { email, password: PASSWORD };
}

/** From the dashboard: creates a form from the lead template and returns its id. */
export async function createLeadForm(page: Page) {
  await page.getByRole("button", { name: /lead (form )?template/i }).first().click();
  await expect(page).toHaveURL(/\/builder\/[A-Za-z0-9]+$/);
  await expect(page.getByRole("main").locator("section").first()).toBeVisible();
  return page.url().split("/builder/")[1];
}

/** Waits for an edit to reach the server: "Saving…" then "Saved". */
export async function waitForSave(page: Page) {
  await expect(page.getByText("Saving…")).toBeVisible();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
}

export async function publish(page: Page) {
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const link = await dialog.getByLabel("Public link", { exact: true }).inputValue();
  await dialog.getByRole("button", { name: "Done" }).click();
  return link;
}

/** A separate, signed-out browser: a respondent or another user. */
export async function freshPage(browser: Browser) {
  const context = await browser.newContext();
  return context.newPage();
}

/** Answers the lead template's live form, taking the Mumbai branch. */
export async function respondMumbai(page: Page, name = "Ravi Kumar") {
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Phone number").fill("9876543210");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByLabel("Which city is the property in?").selectOption("Mumbai");
  await page.getByRole("radio", { name: /2 BHK/ }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByLabel("Email address").fill("ravi@example.com");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("Your response was sent")).toBeVisible();
}
