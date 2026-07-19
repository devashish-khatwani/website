import { expect, test } from "@playwright/test";

const canonicalUrl = "https://www.glauxagent.com/";
const isProductionPagesBuild =
  (process.env.CF_PAGES === "1" ||
    process.env.CF_PAGES?.toLowerCase() === "true") &&
  process.env.CF_PAGES_BRANCH === "main";
const expectedRobotsDirective = isProductionPagesBuild
  ? "Allow: /"
  : "Disallow: /";

test("home page exposes the W-03 design foundation contract", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Glaux draft home content/);
  await expect(
    page.getByRole("link", { name: "Glaux home" }).locator("img"),
  ).toHaveAttribute("src", "/brand/glaux-lockup.svg");
  await expect(
    page.getByRole("heading", {
      name: /Glaux design foundation/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Book a demo" }),
  ).toHaveAttribute("href", "/contact/");
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
    page.getByRole("link", { name: "View primitives" }),
  ).toHaveAttribute("href", "#foundation-primitives");
  await expect(
    page.getByRole("contentinfo").getByRole("navigation", { name: "Legal" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Privacy" })).toHaveAttribute(
    "href",
    "/privacy/",
  );
  await expect(
    page.getByRole("link", { name: "Cookie policy" }),
  ).toHaveAttribute("href", "/cookies/");
  await expect(page.getByRole("link", { name: "Terms" })).toHaveAttribute(
    "href",
    "/terms/",
  );
  await expect(page.locator("#foundation-primitives .badge")).toHaveCount(0);
  await expect(page.getByText(/Powered by Hermes Agent/i)).toHaveCount(0);
  await expect(page.getByText(/upstream runtime branding/i)).toHaveCount(0);
});

test("home page proves light and dark Glaux logo usage", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Glaux home" })).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Glaux owl mark reversed" }),
  ).toHaveAttribute("src", "/brand/glaux-mark-reversed.svg");
});

test("home page exposes visible keyboard focus and mobile touch targets", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const menu = page.getByText("Menu");
  const box = await menu.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(box?.width).toBeGreaterThanOrEqual(44);

  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to main content" }),
  ).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("mobile menu exposes the approved navigation without horizontal overflow", async ({
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

  await expect(page.getByRole("navigation", { name: "Primary" })).toBeHidden();
  await page.getByText("Menu").click();
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

test("navigation targets render honest route shells", async ({ page }) => {
  for (const [path, heading] of [
    ["/product/", "Product"],
    ["/security/", "Security"],
    ["/company/", "Company"],
    ["/contact/", "Book a demo"],
    ["/privacy/", "Privacy"],
    ["/cookies/", "Cookie policy"],
    ["/terms/", "Terms"],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    await expect(
      page.getByText(/route is intentionally a draft shell|route is ready/u),
    ).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow",
    );
  }
});

test("home page exposes canonical and base Open Graph metadata", async ({
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
    "Glaux draft home content",
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    "content",
    /Draft home metadata/u,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    canonicalUrl,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveCount(0);
});

test("robots and sitemap expose the current published route set", async ({
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
  expect(sitemapText).toContain(`<loc>${canonicalUrl}</loc>`);
  expect(sitemapText).not.toContain(
    "<loc>https://www.glauxagent.com/product/</loc>",
  );
  expect(sitemapText).not.toContain(
    "<loc>https://www.glauxagent.com/privacy/</loc>",
  );
});
