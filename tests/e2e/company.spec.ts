import { expect, test } from "@playwright/test";
import {
  expectNoHorizontalOverflow,
  expectVisibleFocusOutline,
} from "./assertions";

const canonicalUrl = "https://www.glauxagent.com/company/";

test("company page renders W-09 mission, maturity status, and contact path", async ({
  page,
}) => {
  await page.goto("/company/");

  await expect(page).toHaveTitle(/Company \| Glaux/u);
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
      name: "Building useful AI work with visible control.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      /research, create, automate, and complete work with approved company knowledge and tools/u,
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Company status")).toContainText(
    "Design-partner stage",
  );
  await expect(page.getByLabel("Company status")).toContainText(
    "design-partner and architecture-review conversations",
  );
  await expect(page.getByLabel("Company status")).toContainText(
    "not currently offered through self-serve signup",
  );
  await expect(page.getByLabel("Company page actions")).toContainText(
    "Book a demo",
  );
  await expect(
    page.getByRole("main").getByRole("link", { name: "Book a demo" }).first(),
  ).toHaveAttribute("href", "/contact/");
});

test("company page keeps internal publication workflow out of visitor copy", async ({
  page,
}) => {
  await page.goto("/company/");

  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Learn how Glaux helps teams use company knowledge and tools with visible controls, and explore design-partner conversations.",
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    "content",
    "Learn how Glaux helps teams use company knowledge and tools with visible controls, and explore design-partner conversations.",
  );
  await expect(page.getByRole("main")).not.toContainText(
    /Draft page|Draft public page|This page stays noindexed|Facts that still need approval|public narrative|content owner|content reviewer|reviewer approval|reviewer approve|draft demo page|form submission|legal decisions|unresolved public-company facts/u,
  );

  await expect(
    page.getByText(
      /Trusted by|customers include|case study|SOC 2|ISO 27001|ISO 42001|HIPAA|FedRAMP|GDPR-compliant|zero trust|zero data retention|military-grade|production-proven|99\.9|uptime SLA|founded in|headquartered in|Series [A-Z]|seed round|Powered by Hermes|Hermes Agent/u,
    ),
  ).toHaveCount(0);
});

test("company page invites a governance-focused conversation without promises", async ({
  page,
}) => {
  await page.goto("/company/");

  await expect(
    page.getByRole("heading", {
      name: "Design-partner conversations are for teams with real governance needs.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Teams evaluating whether an AI assistant can work with approved company knowledge and tools.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Tell us what you want AI to help your team accomplish.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Share the work you want to support, the company knowledge or tools involved, and the governance needs shaping your evaluation.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Tell us about your needs" }),
  ).toHaveAttribute("href", "/contact/");
  await expect(
    page.getByText(/response SLA|form is available|guaranteed response/u),
  ).toHaveCount(0);
});

test("company page has no horizontal overflow and keeps contact focus visible", async ({
  page,
}) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/company/");
    await expectNoHorizontalOverflow(page);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/company/");
  const contactLink = page
    .getByRole("main")
    .getByRole("link", { name: "Book a demo" })
    .first();
  await contactLink.focus();
  await expectVisibleFocusOutline(contactLink);
});
