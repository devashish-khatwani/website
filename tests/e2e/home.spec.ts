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
  await expect(demoLinks).toHaveCount(2);
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

test("hero carousel shows real product captures and honors playback controls and reduced motion", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-11-18T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-11-18T12:00:01Z"));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const showcase = page.getByRole("region", { name: "Glaux product views" });
  const desktop = showcase.getByRole("group", {
    name: "1 of 2: Glaux desktop app",
  });
  const admin = showcase.getByRole("group", {
    name: "2 of 2: Glaux admin console",
  });
  await expect(desktop).toBeVisible();
  await expect(admin).toBeHidden();
  await expect(
    desktop.getByText("Your coworker works on its own machine."),
  ).toBeVisible();
  const expectedDimensions = [
    [2560, 1640],
    [1420, 1273],
  ];
  for (const [index, image] of (
    await showcase.locator("img").all()
  ).entries()) {
    await expect(image).toHaveAttribute("alt", /Glaux/u);
    expect(
      await image.evaluate((img: HTMLImageElement) => [
        img.naturalWidth,
        img.naturalHeight,
      ]),
    ).toEqual(expectedDimensions[index]);
  }
  await page.clock.fastForward(9000);
  await expect(admin).toBeVisible();
  await expect(desktop).toBeHidden();
  await expect(
    admin.getByText("Review the tools in the catalog."),
  ).toBeVisible();

  await showcase.hover();
  await page.clock.fastForward(9000);
  await expect(admin).toBeVisible();
  await page.mouse.move(0, 0);
  await page.clock.fastForward(9000);
  await expect(desktop).toBeVisible();

  await showcase.getByRole("button", { name: "Pause slideshow" }).click();
  await page.getByRole("heading", { level: 1 }).click();
  await page.clock.fastForward(18000);
  await expect(desktop).toBeVisible();
  await showcase.getByRole("button", { name: "Resume slideshow" }).click();
  await page.getByRole("heading", { level: 1 }).click();
  await page.clock.fastForward(9000);
  await expect(admin).toBeVisible();

  await showcase.getByRole("button", { name: "Pause slideshow" }).focus();
  await page.clock.fastForward(9000);
  await expect(admin).toBeVisible();
  await showcase.getByRole("button", { name: "Next view" }).click();
  await expect(desktop).toBeVisible();
  await expect(
    showcase.getByRole("button", { name: "Resume slideshow" }),
  ).toBeVisible();

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(desktop).toBeVisible();
  await expect(
    showcase.getByRole("button", { name: /slideshow/u }),
  ).toBeHidden();
  await page.clock.fastForward(27000);
  await expect(desktop).toBeVisible();
  await expect(admin).toBeHidden();
  await showcase.getByRole("button", { name: "Next view" }).click();
  await expect(admin).toBeVisible();
});

test("home page connects sourced incidents, four product pillars, and a staged cleanup", async ({
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
  const scenario = page.getByRole("region", {
    name: "“Clean up this old database table.”",
  });
  await expect(scenario.getByRole("img")).toHaveCount(2);
  await expect(
    scenario.getByText(
      /production database lives in a separate hosted service/u,
    ),
  ).toBeVisible();
  await expect(
    scenario.getByText(
      /finds legacy_sessions_2024, then tells Sam its tools cannot delete data/u,
    ),
  ).toBeVisible();
  await expect(
    scenario.getByRole("img", {
      name: /catalog details for the fictitious Acme database/u,
    }),
  ).toBeVisible();
  const replies = scenario.getByRole("img", {
    name: /Glaux desktop app tells Sam.*legacy_sessions_2024.*cannot delete/u,
  });
  await expect(replies).toHaveCount(1);
  for (const reply of await replies.all()) {
    await reply.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        reply.evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
      )
      .toBe(true);
  }
  await expect(scenario).toContainText(
    "The agent offers help drafting SQL; no write tool is available.",
  );
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

test("Product links select every home pane on arrival and same-page hash changes", async ({
  page,
}) => {
  await page.goto("/#feature-audit");
  const guide = page.locator("[data-product-section]");
  await expect(guide.locator("[data-feature-panel]:visible")).toHaveAttribute(
    "id",
    "feature-audit",
  );
  await page.goto("/product/");
  for (const pane of productSection.panes) {
    const trigger = page.locator(".nav-dropdown__trigger");
    await trigger.focus();
    await page.keyboard.press("Enter");
    const menu = page.getByRole("navigation", {
      name: "Product sections",
      exact: true,
    });
    await menu
      .getByRole("link", { name: `${pane.name} ${pane.summary}`, exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`/#feature-${pane.id}$`, "u"));
    await expect(menu).toBeHidden();
    await expect(guide.locator("[data-feature-panel]:visible")).toHaveAttribute(
      "id",
      `feature-${pane.id}`,
    );
    await expect(
      guide.locator("[data-feature-panel]:visible"),
    ).toBeInViewport();
    await expect(
      guide
        .getByRole("navigation", { name: "Glaux product panes" })
        .getByRole("link", { name: pane.name, exact: true }),
    ).toHaveAttribute("aria-current", "true");
  }
  await guide
    .getByRole("navigation", { name: "Glaux product panes" })
    .getByRole("link", { name: "Skills", exact: true })
    .click();
  await page.locator(".nav-dropdown__trigger").click();
  await page
    .getByRole("navigation", { name: "Product sections", exact: true })
    .getByRole("link", { name: /^Audit /u })
    .click();
  await expect(guide.locator("[data-feature-panel]:visible")).toHaveAttribute(
    "id",
    "feature-audit",
  );
  for (const label of ["Product", "How it works", "Security"]) {
    await expect(
      page
        .getByRole("navigation", { name: "Footer", exact: true })
        .getByRole("link", { name: label, exact: true }),
    ).toBeAttached();
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
  await expect(page.locator("[data-feature-panel]:visible")).toHaveAttribute(
    "id",
    "feature-audit",
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
  await page.locator("[data-feature-detail] .feature-capture").last().focus();
  for (const name of ["Cleanup scenario agent reply"]) {
    const replyCapture = page.getByRole("region", { name, exact: true });
    await page.keyboard.press("Tab");
    await expectVisibleFocusOutline(replyCapture);
    await expect
      .poll(() =>
        replyCapture
          .getByRole("img")
          .evaluate(
            (image: HTMLImageElement) =>
              image.complete && image.naturalWidth > 0,
          ),
      )
      .toBe(true);
    expect(
      (await replyCapture.getByRole("img").boundingBox())?.width,
    ).toBeGreaterThanOrEqual(1000);
    await page.keyboard.press("ArrowRight");
    await expect
      .poll(() => replyCapture.evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(0);
  }
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
