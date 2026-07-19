import { expect, test } from "@playwright/test";
import {
  expectNoHorizontalOverflow,
  expectVisibleFocusOutline,
} from "./assertions";

const canonicalUrl = "https://www.glauxagent.com/security/";

test("security page renders W-08 plain-language controls and metadata", async ({
  page,
}) => {
  await page.goto("/security/");

  await expect(page).toHaveTitle(/Security \| Glaux/u);
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
      name: "You choose what Glaux can access and do.",
    }),
  ).toBeVisible();

  for (const control of [
    "People",
    "Teams",
    "Tools",
    "Models",
    "Sensitive actions",
  ]) {
    await expect(
      page.getByRole("heading", { name: control, exact: true }),
    ).toBeVisible();
  }

  await expect(
    page.getByRole("heading", {
      name: "People can ask without leaving the task.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Approval and access requests")).toBeVisible();
  await expect(page.getByLabel("Access request path")).toContainText(
    "Access requested",
  );
});

test("security page separates prevention before action from evidence afterward", async ({
  page,
}) => {
  await page.goto("/security/");

  await expect(page.getByLabel("Security control preview")).toContainText(
    "Policy check before action",
  );
  await expect(page.getByLabel("Security control preview")).toContainText(
    "Before action",
  );
  await expect(page.getByLabel("Security control preview")).toContainText(
    "Result recorded",
  );

  await expect(
    page.getByRole("heading", {
      name: "Prevention and evidence are different jobs.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("The rule is checked before the action."),
  ).toBeVisible();
  await expect(
    page.getByText("The record is written after the result."),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Apply the rule" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Record the result" }),
  ).toBeVisible();
});

test("security page covers activity history, data inventory, and technical optionality", async ({
  page,
}) => {
  await page.goto("/security/");

  await expect(
    page.getByLabel("Activity history and admin visibility"),
  ).toContainText("Activity history");
  await expect(
    page.getByLabel("Activity history and admin visibility"),
  ).toContainText("Admin visibility");
  await expect(
    page.getByRole("heading", {
      name: "Inventory first. Guarantees only when approved.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      /people and groups, approved knowledge sources, tool connections, model choices, skills, automations, approvals, access requests, and activity records/u,
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "What we confirm during diligence",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Which deployment boundary applies to your environment?"),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Which retention, residency, deletion, and export terms have been approved?",
    ),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Which security evidence can be shared with your reviewers?",
    ),
  ).toBeVisible();

  const details = page
    .getByRole("group")
    .filter({ hasText: "For security teams" });
  await expect(details).toBeVisible();
  await page.getByText("For security teams").click();

  for (const heading of [
    "Authentication",
    "Request integrity",
    "Isolation",
    "Redaction",
    "Audit",
  ]) {
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }

  await expect(
    page.locator('[data-claim-id="claim-security-request-integrity"]'),
  ).toContainText("Signed Control Tower service requests bind method");
});

test("security page uses standards alignment wording without prohibited claims", async ({
  page,
}) => {
  await page.goto("/security/");

  const standards = page.locator(
    '[data-claim-id="claim-security-standards-alignment"]',
  );
  await expect(standards).toContainText("supports alignment with");
  await expect(standards).toContainText("as design input");
  await expect(standards).toContainText("not proof of third-party review");

  await expect(
    page.getByText(
      /SOC 2|ISO 27001|HIPAA|GDPR|FedRAMP|uptime|zero retention|zero data retention|breach prevention|zero trust|production-proven|customer proof|Powered by Hermes|Hermes Agent|any agent|any platform|flowchart|HMAC|military-grade/u,
    ),
  ).toHaveCount(0);
  await expect(
    page.getByText(
      /What this draft does not overstate|public website|authenticated app|control-plane boundary|target environment|review evidence|public promises/u,
    ),
  ).toHaveCount(0);
});

test("security page stays out of the sitemap while draft", async ({
  request,
}) => {
  const sitemap = await request.get("/sitemap.xml");
  await expect(sitemap).toBeOK();

  expect(await sitemap.text()).not.toContain(
    "<loc>https://www.glauxagent.com/security/</loc>",
  );
});

test("security page has no horizontal overflow and keeps disclosure keyboard focus visible", async ({
  page,
}) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/security/");
    await expectNoHorizontalOverflow(page);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/security/");
  const summary = page.locator("summary", { hasText: "For security teams" });
  await summary.focus();
  await expectVisibleFocusOutline(summary);
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", {
      name: "Review the controls behind governed work.",
    }),
  ).toBeVisible();
});
