import { expect, test } from "@playwright/test";
import {
  expectNoHorizontalOverflow,
  expectVisibleFocusOutline,
} from "./assertions";

const canonicalUrl = "https://www.glauxagent.com/";
const isProductionPagesBuild =
  (process.env.CF_PAGES === "1" ||
    process.env.CF_PAGES?.toLowerCase() === "true") &&
  process.env.CF_PAGES_BRANCH === "main";
const expectedRobotsDirective = isProductionPagesBuild
  ? "Allow: /"
  : "Disallow: /";

test("home page explains the governed desktop runtime and offers an honest next step", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle(
    /Your agent shouldn't reach production unless you say so/u,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
  await expect(
    page.getByRole("link", { name: "Glaux home" }).locator("img"),
  ).toHaveAttribute("src", "/brand/glaux-lockup.svg");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Your agent shouldn't reach production unless you say so.",
  );
  await expect(
    page.getByText(/Each agent runs in the Glaux desktop app/u),
  ).toBeVisible();
  const demoLinks = page
    .getByRole("main")
    .getByRole("link", { name: "Book a demo" });
  await expect(demoLinks).toHaveCount(2);
  for (const link of await demoLinks.all()) {
    await expect(link).toHaveAttribute(
      "href",
      "https://www.glauxagent.com/contact/",
    );
  }
  await expect(
    page.getByText("Coming soon · video not yet available"),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Watch the walkthrough/u }),
  ).toHaveCount(0);
  const hero = page.getByRole("img", {
    name: "The Glaux desktop app, ready for a new work session.",
    exact: true,
  });
  await expect(hero).toBeVisible();
  expect(
    await hero.evaluate(
      (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
    ),
  ).toBe(true);
  await expect(hero).toHaveAttribute("src", /^\/product\//u);
});

test("home page connects sourced incidents, four controls, and a staged cleanup", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Read the reporting" }),
  ).toHaveAttribute(
    "href",
    "https://www.theregister.com/2025/07/21/replit_saastr_vibe_coding_incident/",
  );
  await expect(
    page.getByRole("link", { name: "Read the issue report" }),
  ).toHaveAttribute(
    "href",
    "https://github.com/anthropics/claude-code/issues/12637",
  );
  await expect(
    page.getByRole("heading", { name: "Glaux is the governed runtime" }),
  ).toBeVisible();
  for (const title of ["Own machine", "Approved tools", "Approvals", "Audit"]) {
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
  }
  const scenario = page.getByRole("region", {
    name: "“Clean up this old database table.”",
  });
  await expect(scenario.getByRole("img")).toHaveCount(2);
  await expect(
    scenario.getByText(/Separate staged captures on disposable demo data/u),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Read security details" }),
  ).toHaveAttribute("href", "/security/");
  await expect(page.getByLabel("Product stage")).toContainText(
    "not generally available",
  );
  await expect(
    page.getByRole("heading", { name: "Real work. Your guardrails." }),
  ).toBeVisible();
  await expect(page.locator("[data-claim-id]")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "See what's in preview" }),
  ).toHaveAttribute("href", "/product/#what-comes-next");
});

test("home page preserves shell navigation and focus behavior", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page
      .getByRole("navigation", { name: "Primary" })
      .locator("summary", { hasText: "Product" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("link", { name: "Company" }),
  ).toHaveAttribute("href", "/company/");
  await expect(
    page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("link", { name: "Resources" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Sign in" }).first(),
  ).toHaveAttribute("href", "https://app.glauxagent.com/login");
  await expect(
    page.getByRole("contentinfo").getByRole("navigation", { name: "Legal" }),
  ).toHaveCount(0);

  const primaryNavigation = page.getByRole("navigation", { name: "Primary" });
  await primaryNavigation.getByRole("link", { name: "Sign in" }).focus();
  await page.keyboard.press("Tab");
  await expectVisibleFocusOutline(
    page.getByRole("banner").getByRole("link", { name: "Book a demo" }),
  );

  const footer = page.getByRole("contentinfo");
  const footerProductLink = footer
    .getByRole("navigation", { name: "Footer" })
    .getByRole("link", { name: "Product" });
  await footerProductLink.focus();
  await expectVisibleFocusOutline(footerProductLink);
});

test("desktop navigation groups product sections in an accessible dropdown", async ({
  page,
}) => {
  await page.goto("/");

  const primaryNavigation = page.getByRole("navigation", { name: "Primary" });
  const productTrigger = primaryNavigation.locator("summary", {
    hasText: "Product",
  });
  const productSections = page.getByRole("navigation", {
    name: "Product sections",
  });

  await expect(productSections).toBeHidden();
  await productTrigger.click();
  await expect(productSections).toBeVisible();
  await expect(productSections.getByRole("link")).toHaveCount(3);
  await expect(
    productSections.getByRole("link", { name: /Product overview/u }),
  ).toHaveAttribute("href", "/product/");
  await expect(
    productSections.getByRole("link", { name: /How it works/u }),
  ).toHaveAttribute("href", "/how-it-works/");
  await expect(
    productSections.getByRole("link", { name: /Security/u }),
  ).toHaveAttribute("href", "/security/");

  await page.keyboard.press("Escape");
  await expect(productSections).toBeHidden();
  await expect(productTrigger).toBeFocused();
});

test("home page stays within viewport across responsive widths", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expectNoHorizontalOverflow(page);
  }
});

test("mobile home page exposes navigation without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const menu = page.getByLabel("Open navigation");
  const box = await menu.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(box?.width).toBeGreaterThanOrEqual(44);

  await expect(page.getByRole("navigation", { name: "Primary" })).toBeHidden();
  await menu.click();
  const mobileNav = page.getByRole("navigation", { name: "Mobile primary" });
  await expect(
    mobileNav.getByRole("link", { name: "Product overview" }),
  ).toHaveAttribute("href", "/product/");
  await expect(
    mobileNav.getByRole("link", { name: "How it works" }),
  ).toHaveAttribute("href", "/how-it-works/");
  await expect(
    mobileNav.getByRole("link", { name: "Security" }),
  ).toHaveAttribute("href", "/security/");
  await expect(
    mobileNav.getByRole("link", { name: "Company" }),
  ).toHaveAttribute("href", "/company/");
  await expect(
    mobileNav.getByRole("link", { name: "Sign in" }),
  ).toHaveAttribute("href", "https://app.glauxagent.com/login");
  await expect(
    mobileNav.getByRole("link", { name: "Book a demo" }),
  ).toHaveAttribute("href", "/contact/");
  await expectNoHorizontalOverflow(page);
});

test("home page exposes canonical and draft Open Graph metadata", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    canonicalUrl,
  );
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
    "content",
    "website",
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "Glaux | Your agent shouldn't reach production unless you say so.",
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    "content",
    /its own machine, admin-approved tools including MCP/u,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    canonicalUrl,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveCount(0);
});

test("robots and sitemap keep the draft homepage out of published routes", async ({
  request,
}) => {
  const robots = await request.get("/robots.txt");
  await expect(robots).toBeOK();
  expect(robots.headers()["content-type"]).toMatch(
    /text\/plain(?:;charset=utf-8|; charset=utf-8)?/u,
  );
  const robotsText = await robots.text();
  expect(robotsText).toContain("User-agent: *");
  expect(robotsText).toContain(expectedRobotsDirective);
  expect(robotsText).toContain(
    "Sitemap: https://www.glauxagent.com/sitemap.xml",
  );

  const sitemap = await request.get("/sitemap.xml");
  await expect(sitemap).toBeOK();
  expect(sitemap.headers()["content-type"]).toMatch(
    /(?:application|text)\/xml(?:;charset=utf-8|; charset=utf-8)?/u,
  );
  const sitemapText = await sitemap.text();
  expect(sitemapText).toContain('<?xml version="1.0" encoding="UTF-8"?>');
  expect(sitemapText).toContain(
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  );
  expect(sitemapText).not.toContain(`<loc>${canonicalUrl}</loc>`);
  expect(sitemapText).not.toContain(
    "<loc>https://www.glauxagent.com/product/</loc>",
  );
  expect(sitemapText).not.toContain(
    "<loc>https://www.glauxagent.com/privacy/</loc>",
  );
});
