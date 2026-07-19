import { expect, test } from "@playwright/test";
import {
  expectNoHorizontalOverflow,
  expectVisibleFocusOutline,
} from "./assertions";

const canonicalUrl = "https://www.glauxagent.com/contact/";

async function fillValidDemoRequest(page: import("@playwright/test").Page) {
  await page.getByLabel(/Work email/u).fill("operator@example.com");
  await page.getByLabel(/Name/u).fill("Ada Lovelace");
  await page.getByLabel(/Company/u).fill("Example Company");
  await page.getByLabel(/Role/u).fill("Security lead");
  await page.getByLabel(/Deployment stage/u).selectOption("Planning a pilot");
  await page.getByLabel(/Expected users/u).selectOption("26-100");
  await page
    .getByLabel(/Primary governance concern/u)
    .selectOption("Approvals and access");
  await page
    .getByLabel(/Optional message/u)
    .fill("We want to understand approval paths.");
  await page.getByLabel(/I understand this form/u).check();
}

test("contact page renders the W-10 noindexed form fields and route metadata", async ({
  page,
}) => {
  await page.goto("/contact/");

  await expect(page).toHaveTitle(/Book a demo \| Glaux/u);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    canonicalUrl,
  );
  await expect(
    page.getByRole("heading", {
      name: "Tell us what your team wants AI to help with.",
    }),
  ).toBeVisible();

  for (const label of [
    /Work email/u,
    /Name/u,
    /Company/u,
    /Role/u,
    /Deployment stage/u,
    /Expected users/u,
    /Primary governance concern/u,
    /Optional message/u,
    /I understand this form/u,
  ]) {
    await expect(page.getByLabel(label)).toBeVisible();
  }

  await expect(page.getByRole("form")).toHaveAttribute(
    "data-processor-enabled",
    "false",
  );
  await expect(page.getByText(/does not send your information/u)).toBeVisible();
});

test("contact form reports field errors, focuses the first invalid field, and preserves input", async ({
  page,
}) => {
  await page.goto("/contact/");
  await page.getByLabel(/Work email/u).fill("not-an-email");
  await page.getByLabel(/Company/u).fill("Example Company");
  await page.getByRole("button", { name: "Check request" }).click();

  await expect(page.getByRole("status")).toContainText(
    "Some fields need attention",
  );
  await expect(page.getByLabel(/Work email/u)).toBeFocused();
  await expect(page.locator("#workEmail-error")).toContainText("valid format");
  await expect(page.locator("#name-error")).toContainText("name");
  await expect(page.locator("#company-error")).toBeHidden();
  await expect(page.getByLabel(/Company/u)).toHaveValue("Example Company");
});

test("contact form corrects errors and reaches the safe unavailable processor state", async ({
  page,
}) => {
  await page.goto("/contact/");

  await fillValidDemoRequest(page);
  await page.getByRole("button", { name: "Check request" }).click();

  await expect(page.getByRole("status")).toContainText(
    "Online demo requests are not open yet",
  );
  await expect(
    page.getByText(/stack trace|provider|CRM|inbox|internal destination/u),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();

  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Online demo requests are not open yet",
  );
});

test("contact form does not make a network submission or navigate", async ({
  page,
}) => {
  const attemptedSubmissions: string[] = [];
  page.on("request", (request) => {
    if (["fetch", "xhr"].includes(request.resourceType())) {
      attemptedSubmissions.push(request.url());
    }
  });

  await page.goto("/contact/");
  await page.waitForLoadState("networkidle");
  attemptedSubmissions.length = 0;
  const initialUrl = page.url();
  await fillValidDemoRequest(page);
  await page.getByRole("button", { name: "Check request" }).click();

  await expect(page.getByRole("status")).toContainText(
    "Online demo requests are not open yet",
  );
  expect(page.url()).toBe(initialUrl);
  expect(attemptedSubmissions).toEqual([]);
});

test("contact form keyboard focus remains visible and mobile/desktop layouts do not overflow", async ({
  page,
}) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/contact/");
    await expectNoHorizontalOverflow(page);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/contact/");
  const emailField = page.getByLabel(/Work email/u);
  await emailField.focus();
  await expectVisibleFocusOutline(emailField);
});

test("contact stays out of the sitemap while draft publication blockers remain", async ({
  page,
}) => {
  await page.goto("/sitemap.xml");
  await expect(page.locator("body")).not.toContainText("/contact/");
});
