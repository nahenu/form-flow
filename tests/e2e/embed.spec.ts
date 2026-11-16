import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { expect, test } from "@playwright/test";
import { createLeadForm, publish, signUp } from "./helpers";

/**
 * A real "partner" website on its own port (a different origin from FormFlow).
 * It has to be a real server: Chrome's Local Network Access rules block a page
 * without a network address (e.g. one faked with route.fulfill) from loading
 * scripts from localhost.
 */
let partner: Server;
let partnerUrl = "";
let html = "";

test.beforeAll(async () => {
  partner = createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
  });
  await new Promise<void>((resolve) => partner.listen(0, "127.0.0.1", resolve));
  partnerUrl = `http://127.0.0.1:${(partner.address() as AddressInfo).port}`;
});

test.afterAll(() => new Promise<void>((resolve) => partner.close(() => resolve())));

test("the embed script mounts the form on another site and sizes the frame to fit", async ({ page, baseURL }) => {
  await signUp(page);
  const formId = await createLeadForm(page);
  await publish(page);

  html = `<!doctype html><html><body style="margin:0;padding:24px;background:#fdf2f8">
    <h1>Partner site</h1>
    <div data-formflow="${formId}"></div>
    <script async src="${baseURL}/embed.js"></script>
  </body></html>`;
  await page.goto(`${partnerUrl}/landing?utm_source=partner`);

  const frame = page.locator(`[data-formflow="${formId}"] > iframe`);
  // The host page's UTM tags are forwarded for attribution.
  await expect(frame).toHaveAttribute("src", `${baseURL}/f/${formId}?embed=1&utm_source=partner`);
  await expect(page.frameLocator(`[data-formflow="${formId}"] > iframe`).getByRole("heading", { name: "About you" })).toBeVisible();
  // Starts at a 560px placeholder and resizes to the form's real height.
  await expect.poll(() => frame.evaluate((f: HTMLIFrameElement) => f.style.height)).not.toBe("560px");
});
