import { expect, test } from "@playwright/test";
import { createLeadForm, freshPage, publish, respondMumbai, signUp, waitForSave } from "./helpers";

test("publish, collect a response, see it in results, export it, unpublish", async ({ page, browser }) => {
  await signUp(page, "Pia Shah");
  const formId = await createLeadForm(page);
  const link = await publish(page);
  expect(link).toMatch(new RegExp(`/f/${formId}$`));

  // A respondent arrives from an Instagram campaign.
  const respondent = await freshPage(browser);
  await respondent.goto(`${link}?utm_source=instagram&utm_campaign=diwali`);
  await respondMumbai(respondent);

  // The owner sees it.
  await page.goto(`/forms/${formId}/results`);
  const submittedKpi = page.locator("dl > div").filter({ has: page.getByText("Submitted", { exact: true }) });
  await expect(submittedKpi).toContainText("1");
  await expect(page.getByRole("heading", { name: "Where visitors came from" }).locator("..")).toContainText("instagram");
  await expect(page.getByRole("table")).toContainText("Ravi Kumar");

  const csv = await page.request.get(`/api/forms/${formId}/export`);
  expect(csv.status()).toBe(200);
  expect(csv.headers()["content-type"]).toContain("text/csv");
  const body = await csv.text();
  expect(body).toContain('"instagram","diwali","Ravi Kumar"');

  // Unpublishing kills the link.
  await page.goto(`/builder/${formId}`);
  await page.getByRole("button", { name: "Share" }).click();
  await page.getByRole("button", { name: "Unpublish" }).click();
  await expect(page.getByText("Form unpublished")).toBeVisible();
  await respondent.goto(link);
  await expect(respondent.getByRole("heading", { name: "This page isn't here." })).toBeVisible();
});

test("the live form only changes when you publish again", async ({ page, browser }) => {
  await signUp(page);
  const formId = await createLeadForm(page);
  await publish(page);

  await page.getByLabel("Form title").fill("Renamed after publishing");
  await waitForSave(page);
  await expect(page.getByRole("button", { name: "Publish changes" })).toBeVisible();

  const visitor = await freshPage(browser);
  await visitor.goto(`/f/${formId}`);
  await expect(visitor).toHaveTitle(/Interior design enquiry/);

  await page.getByRole("button", { name: "Publish changes" }).click();
  await expect(page.getByText("Changes are live")).toBeVisible();
  await visitor.reload();
  await expect(visitor).toHaveTitle(/Renamed after publishing/);
});

test("other accounts can't see or export your form", async ({ page, browser }) => {
  await signUp(page, "Owner");
  const formId = await createLeadForm(page);

  const intruder = await freshPage(browser);
  await signUp(intruder, "Intruder");
  for (const path of [`/builder/${formId}`, `/forms/${formId}/results`]) {
    await intruder.goto(path);
    await expect(intruder.getByRole("heading", { name: "This page isn't here." })).toBeVisible();
  }
  expect((await intruder.request.get(`/api/forms/${formId}/export`)).status()).toBe(404);
  expect((await (await freshPage(browser)).request.get(`/api/forms/${formId}/export`)).status()).toBe(401);
});

test("the events endpoint validates its input", async ({ request, page }) => {
  await signUp(page);
  const formId = await createLeadForm(page);
  await publish(page);

  const post = (data: unknown) => request.post("/api/events", { data: typeof data === "string" ? data : JSON.stringify(data) });
  expect((await post("{not json")).status()).toBe(400);
  expect((await post({ formId, visitorId: "x", events: [] })).status()).toBe(400);
  expect((await post({ formId: "nope", visitorId: "abcdefgh-1234", events: [{ type: "view" }] })).status()).toBe(404);
  expect((await post({ formId, visitorId: "abcdefgh-1234", events: [{ type: "view" }] })).status()).toBe(204);
});
