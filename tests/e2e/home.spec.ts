import { expect, test } from "@playwright/test";
import { expectVisibleFocusOutline } from "./assertions";

const canonicalUrl = "https://www.glauxagent.com/";
const isProductionPagesBuild =
  (process.env.CF_PAGES === "1" ||
    process.env.CF_PAGES?.toLowerCase() === "true") &&
  process.env.CF_PAGES_BRANCH === "main";
const expectedRobotsDirective = isProductionPagesBuild
  ? "Allow: /"
  : "Disallow: /";

test("home page renders the W-06 homepage promise and product preview", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/AI your whole team can work with/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
  await expect(
    page.getByRole("link", { name: "Glaux home" }).locator("img"),
  ).toHaveAttribute("src", "/brand/glaux-lockup.svg");
  await expect(
    page.getByRole("heading", {
      name: "AI your whole team can work with.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      /research, create, and automate with company knowledge and tools/i,
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Book a demo" }),
  ).toHaveAttribute("href", "/contact/");
  await expect(
    page.getByRole("main").getByRole("link", { name: "Explore the product" }),
  ).toHaveAttribute("href", "/product/");
  await expect(
    page.getByLabel("Illustrative product view").getByText("Team lead"),
  ).toBeVisible();
  await expect(
    page.getByText("Renewal-risk brief", { exact: true }),
  ).toBeVisible();
});

test("home page uses plain-language benefits and governance outcomes", async ({
  page,
}) => {
  await page.goto("/");

  for (const label of [
    "Work with your knowledge",
    "Take useful action",
    "Stay in control",
    "Research",
    "Automation",
    "Administration",
  ]) {
    await expect(page.getByRole("heading", { name: label })).toBeVisible();
  }

  await expect(
    page.getByRole("heading", {
      name: "Set the rules once. Glaux carries them into the work.",
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
  await expect(page.getByText(/flowchart/i)).toHaveCount(0);
  await expect(page.getByRole("main").locator("svg")).toHaveCount(0);
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
      /Laminar|Inkling|Tinker|Powered by Hermes|Hermes Agent|draft claim registry|certification claims|governed Hermes Agent/u,
    ),
  ).toHaveCount(0);
});

test("home page preserves shell navigation, legal links, and focus behavior", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("navigation", { name: "Primary" }).getByRole("link"),
  ).toHaveText(["Product", "Security", "Company", "Sign in", "Book a demo"]);
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
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Privacy" })).toHaveAttribute(
    "href",
    "/privacy/",
  );

  const primaryNavigation = page.getByRole("navigation", { name: "Primary" });
  await primaryNavigation.getByRole("link", { name: "Sign in" }).focus();
  await page.keyboard.press("Tab");
  await expectVisibleFocusOutline(
    page.getByRole("banner").getByRole("link", { name: "Book a demo" }),
  );

  const footer = page.getByRole("contentinfo");
  await footer
    .getByRole("navigation", { name: "Footer" })
    .getByRole("link", { name: "Book a demo" })
    .focus();
  await page.keyboard.press("Tab");
  await expectVisibleFocusOutline(
    footer.getByRole("link", { name: "Privacy" }),
  );
});

test("mobile home page exposes navigation without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  await page.goto("/");

  const menu = page.getByLabel("Open navigation");
  const box = await menu.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(box?.width).toBeGreaterThanOrEqual(44);

  await expect(page.getByRole("navigation", { name: "Primary" })).toBeHidden();
  await menu.click();
  const mobileNav = page.getByRole("navigation", { name: "Mobile primary" });
  await expect(
    mobileNav.getByRole("link", { name: "Product" }),
  ).toHaveAttribute("href", "/product/");
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

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
  expect(consoleErrors).toEqual([]);
});

test("legal navigation targets render honest noindexed draft shells", async ({
  page,
}) => {
  for (const [path, heading] of [
    ["/privacy/", "How the public website is intended to handle contact data."],
    ["/cookies/", "The launch website keeps analytics narrow."],
    ["/terms/", "Terms"],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    await expect(
      page.getByText(
        /route is intentionally a draft shell|route is ready|noindex and unpublished/u,
      ),
    ).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow",
    );
  }
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
    "Glaux | AI your whole team can work with",
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    "content",
    /keeping governance visible/u,
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
