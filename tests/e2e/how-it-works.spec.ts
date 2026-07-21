import { expect, test } from "@playwright/test";

test("how it works explains the governed work path", async ({ page }) => {
  await page.goto("/how-it-works/");

  await expect(page).toHaveTitle("How it works | Glaux");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://www.glauxagent.com/how-it-works/",
  );
  await expect(
    page.getByRole("heading", { name: "From request to reviewable result." }),
  ).toBeVisible();

  for (const step of [
    "Ask for an outcome",
    "Assemble approved capabilities",
    "Work through the task",
    "Return the result and record",
  ]) {
    await expect(page.getByRole("heading", { name: step })).toBeVisible();
  }

  for (const decision of ["Continue", "Ask for approval", "Stop safely"]) {
    await expect(page.getByText(decision, { exact: true })).toBeVisible();
  }
});

test("how it works keeps preview capabilities labeled and public copy claim-safe", async ({
  page,
}) => {
  await page.goto("/how-it-works/");

  for (const [claimId, title, statement] of [
    [
      "claim-skillhub-preview",
      "Enterprise SkillHub",
      "Share trusted ways of working.",
    ],
    [
      "claim-enterprise-mcp-preview",
      "Enterprise connections",
      "Connect the tools your company depends on.",
    ],
    [
      "claim-observability-preview",
      "Observability",
      "See how agents perform, where they struggle, and where controls intervene.",
    ],
  ] as const) {
    const claim = page.locator(`[data-claim-id="${claimId}"]`);
    await expect(claim.getByRole("heading", { name: title })).toBeVisible();
    await expect(claim.getByText(statement, { exact: true })).toBeVisible();
    await expect(claim.locator(".badge")).toHaveText("Preview");
  }

  await expect(
    page.getByText(
      /Powered by Hermes|Hermes Agent|any agent|any platform|SOC 2 certified|ISO 27001 certified/u,
    ),
  ).toHaveCount(0);
});

test("how it works is in desktop and mobile navigation without overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/how-it-works/");

  await page.getByLabel("Open navigation").click();
  await expect(
    page
      .getByRole("navigation", { name: "Mobile primary" })
      .getByRole("link", { name: "How it works" }),
  ).toHaveAttribute("aria-current", "page");

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});
