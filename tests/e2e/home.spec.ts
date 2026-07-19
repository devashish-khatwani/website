import { expect, test } from "@playwright/test";

const canonicalUrl = "https://www.glauxagent.com/";

test("home page exposes the W-02 placeholder contract", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Glaux draft home content/);
  await expect(page.getByRole("link", { name: "Glaux home" })).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /Glaux public website bootstrap is ready/i,
    }),
  ).toBeVisible();
  await expect(page.getByText("No analytics yet")).toBeVisible();
  await expect(page.getByText(/Powered by Hermes Agent/i)).toHaveCount(0);
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
  expect(robotsText).toContain("Disallow: /");
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
