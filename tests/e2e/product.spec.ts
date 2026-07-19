import { expect, test, type Page } from "@playwright/test";

const canonicalUrl = "https://www.glauxagent.com/product/";

async function expectNoHorizontalOverflow(page: Page) {
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );

  expect(hasHorizontalOverflow).toBe(false);
}

test("product page renders the W-07 employee and admin story", async ({
  page,
}) => {
  await page.goto("/product/");

  await expect(page).toHaveTitle(/Product \| Glaux/u);
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
      name: "Useful work, with the rules built in.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/approved company knowledge and approved tools/u),
  ).toBeVisible();
  await expect(
    page.getByLabel("Product work preview").getByText("Q3 launch brief"),
  ).toBeVisible();

  for (const workMode of [
    "Ask",
    "Research",
    "Write",
    "Analyze",
    "Browse",
    "Create artifacts",
  ]) {
    await expect(
      page.getByRole("heading", { name: workMode, exact: true }),
    ).toBeVisible();
  }

  for (const [claimId, title, statement, label] of [
    [
      "claim-skillhub-preview",
      "Enterprise SkillHub",
      "Share trusted ways of working.",
      "Preview",
    ],
    [
      "claim-enterprise-mcp-preview",
      "Enterprise connections",
      "Connect the tools your company depends on.",
      "Preview",
    ],
  ] as const) {
    const card = page.locator(`[data-claim-id="${claimId}"]`);
    await expect(card.getByRole("heading", { name: title })).toBeVisible();
    await expect(card.getByText(statement, { exact: true })).toBeVisible();
    await expect(card.locator(".badge")).toHaveText(label);
  }

  await expect(
    page.getByRole("heading", { name: "Approved tools", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Automations", exact: true }),
  ).toBeVisible();

  for (const scope of [
    "People",
    "Groups",
    "Tools",
    "Models",
    "Skills",
    "Usage",
    "Activity",
  ]) {
    await expect(
      page.getByLabel("Administrator management scope").getByText(scope, {
        exact: true,
      }),
    ).toBeVisible();
  }
});

test("product page covers approvals and recent decisions without color-only meaning", async ({
  page,
}) => {
  await page.goto("/product/");

  await expect(
    page.getByRole("heading", { name: "Ask without leaving the work." }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Approval request preview").getByText("Reason:"),
  ).toBeVisible();

  const decisions = [
    ["continued", "The request matched the rules, so work carried on."],
    [
      "approval requested",
      "The next step needs the right person to approve it first.",
    ],
    [
      "stopped",
      "The request crossed a boundary and was blocked before action.",
    ],
    [
      "needs attention",
      "A person should review the change before the workflow continues.",
    ],
  ] as const;

  for (const [label, meaning] of decisions) {
    const row = page.getByLabel("Recent decisions").filter({ hasText: label });

    await expect(row.getByText(label, { exact: true })).toBeVisible();
    await expect(row.getByText(meaning, { exact: true })).toBeVisible();
  }
});

test("product page keeps technical depth optional and avoids unsafe public claims", async ({
  page,
}) => {
  await page.goto("/product/");

  await expect(
    page.getByRole("heading", {
      name: "Technical detail is available, not the main story.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open technical details" }),
  ).toHaveAttribute("href", "/security/");
  await expect(
    page.getByText(
      /Powered by Hermes|Hermes Agent|SOC 2|ISO 27001|HIPAA|FedRAMP|zero data retention|military-grade|any agent|any platform|flowchart|product page|policy diagram|does not rely on color/u,
    ),
  ).toHaveCount(0);
});

test("product page has no horizontal overflow on mobile, tablet, or desktop", async ({
  page,
}) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/product/");
    await expectNoHorizontalOverflow(page);
  }
});
