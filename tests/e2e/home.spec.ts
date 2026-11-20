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
  await expect(demoLinks).toHaveCount(3);
  for (const link of await demoLinks.all()) {
    await expect(link).toHaveAttribute(
      "href",
      "https://www.glauxagent.com/contact/",
    );
  }
  await expect(
    page.getByText("Coming soon · video not yet available"),
  ).toHaveCount(0);
  await expect(page.getByText("Watch the walkthrough")).toHaveCount(0);
  await expect(page.locator(".home-hero [data-mock-preview]")).toHaveCount(2);
  await expect(page.locator('main img[src^="/product/"]')).toHaveCount(0);
});

test("hero shows both static product mocks together without playback controls or duplicate IDs", async ({
  page,
  browser,
  baseURL,
}) => {
  await page.clock.install();
  await page.goto("/");
  const hero = page.getByRole("region", {
    name: "Glaux product previews",
    exact: true,
  });
  const desktop = hero.locator('[data-mock-preview="desktop"]');
  const tower = hero.locator('[data-mock-preview="admin"]');
  await expect(desktop).toBeVisible();
  await expect(tower).toBeVisible();
  await expect(desktop).toContainText("18,204 rows deleted");
  await expect(tower).toContainText("drop_table");
  await expect(tower).toContainText("Not granted");
  await expect(hero.getByRole("button")).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: /(?:play|pause|replay).*(?:demo|slideshow)|next view|previous view/iu,
    }),
  ).toHaveCount(0);
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  const before = await hero.innerText();
  await page.clock.fastForward(20000);
  expect(await hero.innerText()).toBe(before);
  const duplicateIds = await page.locator("[id]").evaluateAll((elements) => {
    const ids = elements.map((element) => element.id);
    return ids.filter((id, index) => ids.indexOf(id) !== index);
  });
  expect(duplicateIds).toEqual([]);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const left = await desktop.boundingBox();
    const right = await tower.boundingBox();
    if (!left || !right) throw new Error("Both previews must be rendered.");
    if (width === 1440) {
      expect(right.x).toBeGreaterThanOrEqual(left.x + left.width);
      expect(Math.abs(right.y - left.y)).toBeLessThanOrEqual(1);
      expect(Math.abs(right.height - left.height)).toBeLessThanOrEqual(1);
    } else {
      expect(right.y).toBeGreaterThanOrEqual(left.y + left.height);
      expect((await hero.boundingBox())?.height).toBeLessThanOrEqual(650);
    }
    await expectNoHorizontalOverflow(page);
    for (const frame of [desktop, tower]) {
      for (const item of await frame.locator(".mock-nav-item").all()) {
        const icon = item.locator("svg");
        await expect(icon).toHaveCount(1);
        if (width === 1440) await expect(icon).toBeVisible();
        else await expect(icon).toBeHidden();
      }
      expect(
        await frame
          .locator(".mock-main")
          .evaluate((el) => getComputedStyle(el).transform),
      ).toBe("none");
      expect(
        await frame
          .locator(".mock-example")
          .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
      ).toBeGreaterThanOrEqual(12);
    }
  }
  if (!baseURL) throw new Error("The preview URL is required.");
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  const fallback = await context.newPage();
  await fallback.goto("/");
  await expect(fallback.locator(".home-hero [data-mock-preview]")).toHaveCount(
    2,
  );
  await expect(fallback.locator('[data-mock-preview="desktop"]')).toContainText(
    "18,204 rows deleted",
  );
  await expect(fallback.locator('[data-mock-preview="admin"]')).toContainText(
    "Not granted",
  );
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
    page.getByRole("banner").getByRole("link", { name: "Book a demo" }),
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
  await expect(links).toHaveCount(productSection.panes.length);
  for (const [index, pane] of productSection.panes.entries()) {
    await expect(links.nth(index)).toHaveAttribute(
      "href",
      `/#feature-${pane.id}`,
    );
    await expect(links.nth(index).locator("strong")).toHaveText(pane.name);
    await expect(links.nth(index).locator("p")).toHaveText(pane.summary);
  }
  const soon = menu.getByRole("region", { name: "Coming soon", exact: true });
  await expect(soon.getByRole("listitem")).toHaveCount(4);
  await expect(
    soon.locator("a, button, input, select, textarea, [tabindex]"),
  ).toHaveCount(0);
  for (const item of productSection.comingSoon.items) {
    const row = soon.getByRole("listitem").filter({ hasText: item.name });
    await expect(row.locator("strong")).toHaveText(item.name);
    await expect(row.locator("p")).toHaveText(item.teaser);
    await expect(row.getByText("Soon", { exact: true })).toBeVisible();
  }
  await expect(
    menu.getByRole("link", { name: "Book a demo", exact: true }),
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
      .locator(".home-hero")
      .getByRole("link", { name: "Book a demo" });
    await heroDemo.click({ trial: true });
    await page.locator(".nav-dropdown__trigger").click();
    await expect
      .poll(() =>
        heroDemo.evaluate((button) => {
          const box = button.getBoundingClientRect();
          return [box.top + 1, box.top + box.height / 2, box.bottom - 1].every(
            (y) =>
              Boolean(
                document
                  .elementFromPoint(box.x + box.width / 2, y)
                  ?.closest(".nav-dropdown__panel"),
              ),
          );
        }),
      )
      .toBe(true);
    const headerActions = page.locator(".site-nav__actions");
    for (const name of ["Sign in", "Book a demo"]) {
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
    mobileNav.getByRole("link", { name: "Book a demo" }),
  ).toHaveAttribute("href", "/contact/");
  await expect(
    mobileNav.getByRole("link", { name: "Book a demo", exact: true }),
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
