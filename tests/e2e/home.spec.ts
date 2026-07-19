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
  await expect(page.getByRole("button", { name: "Book a demo" })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("link", { name: "View primitives" }),
  ).toHaveAttribute("href", "#foundation-primitives");
  await expect(page.locator(".site-header .badge")).toHaveText(
    "Design foundation",
  );
  await expect(page.locator("#foundation-primitives .badge")).toHaveCount(0);
  await expect(page.getByText(/Powered by Hermes Agent/i)).toHaveCount(0);
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

  const primitivesLink = page.getByRole("link", { name: "View primitives" });
  const box = await primitivesLink.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(box?.width).toBeGreaterThanOrEqual(44);

  await page.keyboard.press("Tab");
  await expect(page.locator(":focus-visible")).toBeVisible();
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
});
