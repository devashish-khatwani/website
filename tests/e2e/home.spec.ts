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

test("home page renders the approved homepage promise and product concept", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/AI coworkers\. Enterprise control\./u);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
  await expect(
    page.getByRole("link", { name: "Glaux home" }).locator("img"),
  ).toHaveAttribute("src", "/brand/glaux-lockup.svg");
  await expect(
    page.getByRole("heading", {
      name: "AI coworkers. Enterprise control.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Employees move faster. Security controls what AI can know, do, and share.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("main").getByRole("link", { name: "See Glaux in action" }),
  ).toHaveAttribute("href", "#product");
  await expect(
    page.getByRole("main").getByRole("link", { name: "Book a demo" }),
  ).toHaveAttribute("href", "/contact/");

  const productWindow = page.getByLabel("Illustrative Glaux product concept");
  await expect(
    productWindow
      .locator(".product-window__bar")
      .getByText("Renewal-risk brief", { exact: true }),
  ).toBeVisible();
  await expect(
    productWindow.getByRole("tab", { name: "Employee" }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(productWindow.getByText("Renewal-risk briefing")).toBeVisible();
  await expect(productWindow.getByText("Rules applied")).toBeVisible();
});

test("home page keeps the concept concise without concept-only chrome", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "One task. Two views. No lost context.",
    }),
  ).toBeVisible();
  for (const label of [
    "Ask for work",
    "Bring approved context",
    "Act within policy",
    "Return work and evidence",
    "Policy before action",
    "Authority stays server-owned",
    "Activity after result",
  ]) {
    await expect(page.getByRole("heading", { name: label })).toBeVisible();
  }

  await expect(
    page.getByRole("heading", {
      name: "Control that appears where the work happens.",
    }),
  ).toBeVisible();
  for (const outcome of [
    "Continue",
    "Ask for approval",
    "Stop safely",
    "Explain why",
  ]) {
    await expect(page.getByRole("heading", { name: outcome })).toBeVisible();
  }

  await expect(page.getByText(/Proposed homepage direction/u)).toHaveCount(0);
  await expect(page.getByRole("main").getByText(/Install|Plans/u)).toHaveCount(
    0,
  );
  await expect(page.getByText(/Powered by Hermes|Hermes Agent/u)).toHaveCount(
    0,
  );
});

test("product concept tabs update visible state with mouse and keyboard", async ({
  page,
}) => {
  await page.goto("/");

  const productWindow = page.getByLabel("Illustrative Glaux product concept");
  const employeeTab = productWindow.getByRole("tab", { name: "Employee" });
  const controlTab = productWindow.getByRole("tab", { name: "Control" });
  const employeePanel = page.locator("#employee-view");
  const controlPanel = page.locator("#control-view");

  await expect(employeeTab).toHaveAttribute("aria-selected", "true");
  await expect(employeePanel).toBeVisible();
  await expect(controlPanel).toBeHidden();

  await controlTab.click();
  await expect(controlTab).toHaveAttribute("aria-selected", "true");
  await expect(controlPanel).toBeVisible();
  await expect(employeePanel).toBeHidden();
  await expect(productWindow.getByText("Recent decisions")).toBeVisible();
  await expect(
    productWindow.getByText("Customer summary", { exact: true }),
  ).toBeVisible();

  await controlTab.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(employeeTab).toHaveAttribute("aria-selected", "true");
  await expect(employeeTab).toBeFocused();
  await expect(employeePanel).toBeVisible();
  await expect(controlPanel).toBeHidden();

  await page.keyboard.press("End");
  await expect(controlTab).toHaveAttribute("aria-selected", "true");
  await expect(controlTab).toBeFocused();
  await expect(controlPanel).toBeVisible();

  await page.keyboard.press("Home");
  await expect(employeeTab).toHaveAttribute("aria-selected", "true");
  await expect(employeeTab).toBeFocused();
  await expect(employeePanel).toBeVisible();
});

test("home page renders only approved draft platform labels and statements", async ({
  page,
}) => {
  await page.goto("/");

  const platformClaims = [
    [
      "claim-observability-preview",
      "Observability",
      "See how agents perform, where they struggle, and where controls intervene.",
      "Preview",
    ],
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
    [
      "claim-model-studio-coming-soon",
      "Model Studio",
      "Turn carefully selected enterprise experience into a specialized model the enterprise owns and controls.",
      "Coming soon",
    ],
  ] as const;

  for (const [claimId, title, statement, label] of platformClaims) {
    const card = page.locator(`[data-claim-id="${claimId}"]`);
    await expect(card.getByRole("heading", { name: title })).toBeVisible();
    await expect(card.getByText(statement, { exact: true })).toBeVisible();
    await expect(card.locator(".badge")).toHaveText(label);
  }

  await expect(
    page.getByText(
      /Laminar|Inkling|Tinker|draft claim registry|certification claims|governed Hermes Agent/u,
    ),
  ).toHaveCount(0);
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
    "Glaux | AI coworkers. Enterprise control.",
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    "content",
    /controls what AI can know, do, and share/u,
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
