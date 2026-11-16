import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { PASSWORD, signUp } from "./helpers";

/** The newest email the test server "sent" to this address (see EMAIL_OUTBOX_FILE). */
async function latestEmailTo(email: string): Promise<string | null> {
  const lines = await readFile(".data/e2e/outbox.jsonl", "utf8").catch(() => "");
  const mine = lines
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l) as { to: string; text: string })
    .filter((m) => m.to === email);
  return mine.at(-1)?.text ?? null;
}

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

test("shows the app's own field errors instead of browser popups", async ({ page }) => {
  await page.goto("/sign-up");
  await page.getByLabel("Work email").fill("ssss@");
  await page.getByLabel("Password", { exact: true }).fill("abcd");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.locator("form [id$=-error]")).toHaveText([
    "Enter your name.",
    "That doesn't look like an email address.",
    "Use at least 8 characters (4 more).",
  ]);
  await expect(page.getByLabel("Your name")).toBeFocused();
});

test("an existing email gets a clear message and a way to sign in", async ({ page, browser }) => {
  const { email } = await signUp(page);
  const other = await (await browser.newContext()).newPage();
  await other.goto("/sign-up");
  await other.getByLabel("Your name").fill("Someone Else");
  await other.getByLabel("Work email").fill(email);
  await other.getByLabel("Password", { exact: true }).fill("another-pass-123");
  await other.getByRole("button", { name: "Create account" }).click();
  const alert = other.locator("form [role=alert]");
  await expect(alert).toContainText("An account with this email already exists.");
  await expect(alert.getByRole("link", { name: "Sign in instead" })).toBeVisible();
});

test("remember me decides whether the session outlives the browser", async ({ page, browser }) => {
  const { email } = await signUp(page);
  for (const remember of [false, true]) {
    const context = await browser.newContext();
    const tab = await context.newPage();
    await tab.goto("/sign-in");
    await tab.getByLabel("Work email").fill(email);
    await tab.getByLabel("Password", { exact: true }).fill(PASSWORD);
    if (!remember) await tab.getByLabel("Remember me for 7 days").uncheck();
    await tab.getByRole("button", { name: "Sign in" }).click();
    await expect(tab).toHaveURL(/\/dashboard$/);
    const cookie = (await context.cookies()).find((c) => c.name.endsWith("session_token"));
    if (remember) expect(cookie!.expires * 1000 - Date.now()).toBeGreaterThan(6 * 86_400_000);
    else expect(cookie!.expires).toBe(-1); // a browser-session cookie
    await context.close();
  }
});

test("password reset: email link, new password, old one stops working, link is single-use", async ({ page }) => {
  const { email } = await signUp(page, "Reset Tester");
  await page.context().clearCookies();

  await page.goto("/forgot-password");
  await page.getByLabel("Work email").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status").filter({ hasText: "If an account exists" })).toBeVisible();

  await expect.poll(() => latestEmailTo(email), { timeout: 10_000 }).toMatch(/reset-password/);
  const link = (await latestEmailTo(email))!.match(/https?:\/\/\S+reset-password\/\S+/)![0];

  await page.goto(link);
  await expect(page).toHaveURL(/\/reset-password\?token=/);
  await page.getByLabel("New password", { exact: true }).fill("brand-new-pass-456");
  await page.getByLabel("Confirm new password").fill("brand-new-pass-457");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByText("The two passwords don't match.")).toBeVisible();
  await page.getByLabel("Confirm new password").fill("brand-new-pass-456");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page).toHaveURL(/\/sign-in\?reset=1$/);
  await expect(page.getByText("Password updated. Sign in with your new password.")).toBeVisible();

  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("form [role=alert]")).toContainText("don't match");
  await page.getByLabel("Password", { exact: true }).fill("brand-new-pass-456");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.context().clearCookies();
  await page.goto(link);
  await expect(page.getByText("This reset link has expired or was already used.")).toBeVisible();
});

test("signed-in visitors skip the auth pages", async ({ page }) => {
  await signUp(page);
  await page.goto("/sign-in");
  await expect(page).toHaveURL(/\/dashboard$/);
});
