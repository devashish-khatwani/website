import { expect, test, type Locator } from "@playwright/test";
import { productSection } from "../../src/lib/content/product-section";
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

test("home page presents the approved hero and privacy-safe demo continuation", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/AI coworkers. Enterprise control/u);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
  await expect(
    page.getByRole("link", { name: "Glaux home" }).locator("img"),
  ).toHaveAttribute("src", "/brand/glaux-lockup.svg");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "AI coworkers. Enterprise control.",
  );
  await expect(page.locator('a[href*="/plans"], a[href="#plans"]')).toHaveCount(
    0,
  );
  await expect(page.locator(".hero-lede")).toContainText(
    "Security controls what AI can know, do, and share.",
  );
  for (const img of await page.locator(".hero img").all()) {
    await expect
      .poll(() =>
        img.evaluate(
          (element) =>
            element instanceof HTMLImageElement &&
            element.complete &&
            element.naturalWidth > 0,
        ),
      )
      .toBe(true);
  }
  const demo = page.locator(".demo-form");
  await demo.getByRole("button", { name: "Get a demo" }).click();
  await expect(page).toHaveURL(/\/$/u);
  const email = page.getByRole("textbox", { name: "Work email" });
  await email.fill("website-test@example.invalid");
  await demo.getByRole("button", { name: "Get a demo" }).click();
  await expect(page).toHaveURL(/\/contact\/?\??$/u);
  expect(page.url()).not.toContain("website-test");
});

test("vertical scroll pans the panorama and retraces the shield wave", async ({
  page,
  browser,
  baseURL,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  const track = page.locator(".hero-scroll-track");
  const hero = page.locator(".hero");
  const scene = page.locator(".hero-scene");
  const shield = page.locator(".hero-shield");
  const snapshot = () =>
    shield.evaluate((element) => {
      const matrix = new DOMMatrix(getComputedStyle(element).transform);
      return { x: matrix.m41, y: matrix.m42 };
    });
  expect(
    await track.evaluate((element) => element.clientHeight),
  ).toBeGreaterThan(3000);
  const heroTop = (await hero.boundingBox())?.y;
  const firstPan = await scene.evaluate(
    (element) => getComputedStyle(element).transform,
  );
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: "instant" }));
  await expect.poll(async () => (await snapshot()).y).toBeGreaterThan(30);
  const first = await snapshot();
  expect((await hero.boundingBox())?.y).toBe(heroTop);
  expect(
    await scene.evaluate((element) => getComputedStyle(element).transform),
  ).not.toBe(firstPan);
  await page.evaluate(() =>
    window.scrollTo({ top: 1800, behavior: "instant" }),
  );
  await expect.poll(async () => (await snapshot()).y).toBeLessThan(-30);
  expect((await snapshot()).x).toBeLessThan(first.x);
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: "instant" }));
  await expect
    .poll(async () => Math.abs((await snapshot()).y - first.y))
    .toBeLessThan(0.1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() => track.evaluate((element) => element.clientHeight))
    .toBeLessThan(1000);
  await expect.poll(async () => (await snapshot()).x).toBe(0);
  if (!baseURL) throw new Error("Preview URL required");
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  const fallback = await context.newPage();
  await fallback.goto("/");
  await expect(fallback.getByRole("heading", { level: 1 })).toBeVisible();
  expect(
    await fallback
      .locator(".hero-scroll-track")
      .evaluate((element) => element.clientHeight),
  ).toBeLessThan(1200);
  await fallback
    .getByRole("textbox", { name: "Work email" })
    .fill("nojs@example.invalid");
  await fallback
    .locator(".demo-form")
    .getByRole("button", { name: "Get a demo" })
    .click();
  await expect(fallback).toHaveURL(/\/contact\/?\??$/u);
  await context.close();
});

test("home page connects sourced incidents with the coherent cleanup mock", async ({
  page,
  request,
}) => {
  for (const rejectedAsset of [
    "/product/desktop-approval-750.webp",
    "/product/desktop-result-800.webp",
  ]) {
    expect((await request.get(rejectedAsset)).status()).toBe(404);
  }
  await page.goto("/");
  expect(await page.content()).not.toMatch(
    /DROP\s+TABLE|successfully\s+dropped|Run\s*\/\s*Reject|terminal.{0,80}(?:block|delete)/iu,
  );
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
  const desktop = page.locator('[data-mock="desktop"]');
  await expect(desktop).toContainText("18,204 rows deleted");
  await expect(desktop).toContainText(
    "drop_table isn't included in this database access. Nothing was changed.",
  );
  const tower = page.locator('[data-mock="admin"]');
  await expect(tower).toContainText("Acme production database");
  await expect(tower).toContainText("Not granted");
  await expect(page.locator('main img[src^="/product/"]')).toHaveCount(0);
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
    page.getByRole("link", { name: "See what's coming soon" }),
  ).toHaveAttribute("href", "#product-soon-heading");
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
    page.getByRole("banner").getByRole("link", { name: "Get a demo" }),
  );

  const footer = page.getByRole("contentinfo");
  const footerProductLink = footer
    .getByRole("navigation", { name: "Footer" })
    .getByRole("link", { name: "Product" });
  await footerProductLink.focus();
  await expectVisibleFocusOutline(footerProductLink);
});

async function expectProductMenu(menu: Locator) {
  const links = menu.locator(".product-menu__live a");
  await expect(links).toHaveCount(productSection.panes.length + 1);
  for (const pane of productSection.panes) {
    const entry = menu.locator(
      `.product-menu__live a[href="/#feature-${pane.id}"]`,
    );
    await expect(entry.locator("strong")).toHaveText(pane.name);
    await expect(entry.locator("p")).toHaveText(pane.summary);
    await expect(
      entry.locator(".product-menu__icon svg, .product-menu__icon img"),
    ).toHaveCount(1);
  }
  await expect(
    menu.locator(".product-menu__live").getByText("Preview", { exact: true }),
  ).toHaveCount(0);
  const soon = menu.getByRole("region", { name: "Coming soon", exact: true });
  await expect(soon.getByRole("listitem")).toHaveCount(4);
  await expect(
    soon.locator(
      "li a, li button, li input, li select, li textarea, li [tabindex]",
    ),
  ).toHaveCount(0);
  for (const item of productSection.comingSoon.items) {
    const row = soon.getByRole("listitem").filter({ hasText: item.name });
    await expect(row.locator("strong")).toHaveText(item.name);
    await expect(row.locator("svg")).toHaveCount(1);
    await expect(row.locator("p")).toHaveText(item.teaser);
    await expect(row.getByText("Soon", { exact: true })).toBeVisible();
  }
  await expect(
    menu.getByRole("link", { name: "Get a demo", exact: true }),
  ).toHaveAttribute("href", "/contact/");
}

test("desktop Product supports click, keyboard, Escape and outside dismissal", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const trigger = page.locator(".nav-dropdown__trigger");
  const menu = page.getByRole("navigation", {
    name: "Product sections",
    exact: true,
  });
  await expect(menu).toBeHidden();
  await expect(trigger).toHaveAttribute(
    "aria-controls",
    "desktop-product-menu",
  );
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(menu).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expectProductMenu(menu);
  await expectNoHorizontalOverflow(page);
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Enter");
  const links = menu.getByRole("link");
  for (const link of await links.all()) {
    await page.keyboard.press("Tab");
    await expectVisibleFocusOutline(link);
  }
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Space");
  await expect(menu).toBeVisible();
  await page.mouse.click(20, 800);
  await expect(menu).toBeHidden();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("desktop Product covers the hero demo CTA while header actions stay accessible", async ({
  page,
}) => {
  for (const [width, height] of [
    [1024, 1000],
    [1280, 1000],
    [1440, 1000],
    [1920, 1000],
    [1440, 600],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    const heroDemo = page
      .locator(".hero")
      .getByRole("button", { name: "Get a demo" });
    await heroDemo.click({ trial: true });
    await page.locator(".nav-dropdown__trigger").click();
    const panelBox = await page.locator(".nav-dropdown__panel").boundingBox();
    const heroBox = await page.locator(".hero").boundingBox();
    if (!panelBox || !heroBox)
      throw new Error("Product overlay and hero must render");
    expect(panelBox.y).toBeGreaterThan(heroBox.y);
    expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(height);
    const headerActions = page.locator(".site-nav__actions");
    for (const name of ["Sign in", "Get a demo"]) {
      await headerActions
        .getByRole("link", { name, exact: true })
        .click({ trial: true });
    }
    await page.keyboard.press("Escape");
    await heroDemo.click({ trial: true });
  }
});

test("desktop hover crosses into Product and click pins it until explicitly closed", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const trigger = page.locator(".nav-dropdown__trigger");
  const menu = page.getByRole("navigation", {
    name: "Product sections",
    exact: true,
  });
  await trigger.hover();
  await expect(menu).toBeVisible();
  await menu.getByRole("link").first().hover();
  await expect(menu).toBeVisible();
  await page.mouse.move(0, 600);
  await expect(menu).toBeHidden();
  await trigger.hover();
  await trigger.click();
  await page.mouse.move(0, 600);
  await expect(menu).toBeVisible();
  await trigger.click();
  await expect(menu).toBeHidden();
  await page.keyboard.press("Enter");
  await expect(menu).toBeVisible();
  await page.keyboard.press("Tab");
  await page.mouse.move(0, 600);
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("Product links select and focus every mock pane from another page and the home page", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const source of ["/product/", "/"]) {
    await page.goto(source);
    for (const pane of productSection.panes) {
      await page.locator(".nav-dropdown__trigger").click();
      const menu = page.getByRole("navigation", {
        name: "Product sections",
        exact: true,
      });
      await menu
        .getByRole("link", {
          name: `${pane.name} ${pane.summary}`,
          exact: true,
        })
        .click();
      await expect(page).toHaveURL(new RegExp(`/#feature-${pane.id}$`, "u"));
      await expect(menu).toBeHidden();
      const panel = page.locator(`[data-pane="${pane.id}"]`);
      await expect(panel).toBeVisible();
      const region = page.locator(
        pane.id === "desktop-app" ? "#desktop-view" : "#admin-view",
      );
      await expect(region).toBeFocused();
      await expect(region).toBeInViewport();
    }
  }
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
  const product = mobileNav.locator(".mobile-product");
  const productTrigger = product.locator("summary");
  await expect(product.locator(".product-menu")).toBeHidden();
  await productTrigger.focus();
  await page.keyboard.press("Enter");
  await expectProductMenu(product);
  await expectNoHorizontalOverflow(page);
  await product.getByRole("link", { name: /^Audit /u }).click();
  await expect(page).toHaveURL(/\/#feature-audit$/u);
  await expect(mobileNav).toBeHidden();
  await expect(page.locator('[data-pane="audit"]')).toHaveAttribute(
    "id",
    "mock-pane-audit",
  );
  await menu.click();
  await expect(
    mobileNav.getByRole("link", { name: "Company", exact: true }),
  ).toHaveAttribute("href", "/company/");
  await expect(
    mobileNav.getByRole("link", { name: "Sign in" }),
  ).toHaveAttribute("href", "https://app.glauxagent.com/login");
  await expect(
    mobileNav.getByRole("link", { name: "Get a demo" }),
  ).toHaveAttribute("href", "/contact/");
  await expect(
    mobileNav.getByRole("link", { name: "Get a demo", exact: true }),
  ).toHaveCount(1);
  await menu.click();
  await page.keyboard.press("Tab");
  const audit = page.locator("#admin-view");
  await audit.focus();
  await expectVisibleFocusOutline(audit);
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
  expect(sitemapText).not.toContain(
    "<loc>https://www.glauxagent.com/plans/</loc>",
  );
});
