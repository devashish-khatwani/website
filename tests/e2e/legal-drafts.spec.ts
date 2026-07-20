import { expect, test } from "@playwright/test";
import {
  expectNoHorizontalOverflow,
  expectVisibleFocusOutline,
} from "./assertions";

const draftRoutes = [
  {
    path: "/privacy/",
    heading: "How the public website is intended to handle contact data.",
  },
  {
    path: "/cookies/",
    heading: "The launch website keeps analytics narrow.",
  },
] as const;

test.describe("legal draft routes", () => {
  for (const route of draftRoutes) {
    test(`${route.path} keeps draft approval language visible`, async ({
      page,
    }) => {
      await page.goto(route.path);

      await expect(
        page.getByRole("heading", { name: route.heading }),
      ).toBeVisible();
      await expect(
        page.getByText("Project-owner approval").first(),
      ).toBeVisible();
    });
  }

  test("privacy draft records the approved processor and retention boundaries", async ({
    page,
  }) => {
    await page.goto("/privacy/");
    const main = page.getByRole("main");
    const privacyBoundaryText = [
      "native HubSpot form embedded",
      "HubSpot CRM",
      "No custom form processor",
      "No site-wide HubSpot tracking",
      "Cloudflare Web Analytics",
      "only launch analytics surface",
      "non-marketing by default",
      "processing-only",
      "Preview submissions",
      "www.glauxagent.com",
      "owner-approved retention and deletion rule",
      "monitored privacy/deletion contact",
      "standard HubSpot DPA coverage",
    ];

    for (const text of privacyBoundaryText) {
      await expect(main).toContainText(text);
    }
  });

  test("cookie draft keeps analytics and HubSpot tracking boundaries explicit", async ({
    page,
  }) => {
    await page.goto("/cookies/");
    const main = page.getByRole("main");
    const cookieBoundaryText = [
      "Cloudflare Web Analytics",
      "only approved launch analytics",
      "Google Analytics",
      "Google Tag Manager",
      "Plausible",
      "session replay",
      "HubSpot site-wide tracking",
      "contact-form infrastructure only",
      "feeds HubSpot CRM",
      "processing-only consent",
      "owner-approved retention/deletion rule",
      "monitored privacy/deletion contact",
    ];

    for (const text of cookieBoundaryText) {
      await expect(main).toContainText(text);
    }
    await expect(page.locator("script[src*=hubspot]")).toHaveCount(0);
    await expect(page.locator("script[src*=hsforms]")).toHaveCount(0);
  });

  test("draft pages avoid unapproved legal and compliance claims", async ({
    page,
  }) => {
    for (const route of draftRoutes) {
      await page.goto(route.path);
      const text = await page.getByRole("main").innerText();

      expect(text).not.toMatch(/GDPR compliant/i);
      expect(text).not.toMatch(/CCPA compliant/i);
      expect(text).not.toMatch(/SOC 2 certified/i);
      expect(text).not.toMatch(/HIPAA compliant/i);
      expect(text).not.toMatch(/published terms of service/i);
      expect(text).not.toMatch(/HubSpot tracking code is approved/i);
      expect(text).not.toMatch(/final privacy policy/i);
      expect(text).not.toMatch(/365 days/i);
      expect(text).not.toMatch(/privacy@glauxagent\.com/i);
    }
  });

  test("legal navigation moves between draft pages and keeps visible focus", async ({
    page,
  }) => {
    await page.goto("/privacy/");

    const legalNav = page
      .getByRole("contentinfo")
      .getByRole("navigation", { name: "Legal" });
    await expect(legalNav.getByRole("link")).toHaveText([
      "Privacy",
      "Cookie policy",
      "Terms",
    ]);

    const cookieLink = legalNav.getByRole("link", { name: "Cookie policy" });
    await cookieLink.focus();
    await expectVisibleFocusOutline(cookieLink);
    await cookieLink.click();
    await expect(page).toHaveURL(/\/cookies\/$/u);
    await expect(
      page.getByRole("heading", {
        name: "The launch website keeps analytics narrow.",
      }),
    ).toBeVisible();
  });

  test("draft pages avoid responsive overflow on common viewports", async ({
    page,
  }) => {
    for (const route of draftRoutes) {
      for (const viewport of [
        { width: 390, height: 844 },
        { width: 768, height: 1024 },
        { width: 1440, height: 1000 },
      ]) {
        await page.setViewportSize(viewport);
        await page.goto(route.path);
        await expectNoHorizontalOverflow(page);
        await expect(
          page.getByRole("main").getByRole("heading", { level: 1 }),
        ).toBeVisible();
      }
    }
  });
});
