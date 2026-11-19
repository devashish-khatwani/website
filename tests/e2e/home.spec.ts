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

test("hero carousel shows full real windows and honors playback controls and reduced motion", async ({
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
    [1600, 1000],
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
    admin.getByText("Your admin decides which tools it gets."),
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

test("home page connects sourced incidents, four controls, and a staged cleanup", async ({
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
    scenario.getByRole("img", { name: /read-only MCP tool permissions/u }),
  ).toBeVisible();
  const replies = page.getByRole("img", {
    name: /Glaux desktop app tells Sam.*legacy_sessions_2024.*cannot delete/u,
  });
  await expect(replies).toHaveCount(2);
  for (const reply of await replies.all()) {
    await reply.scrollIntoViewIfNeeded();
    expect(
      await reply.evaluate(
        (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
      ),
    ).toBe(true);
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
  await menu.click();
  const toolCapture = page.getByRole("region", {
    name: "Approved tools product capture",
    exact: true,
  });
  await page.getByRole("link", { name: "Read the issue report" }).focus();
  await page.keyboard.press("Tab");
  await expectVisibleFocusOutline(toolCapture);
  const image = toolCapture.getByRole("img");
  expect((await image.boundingBox())?.width).toBeGreaterThanOrEqual(650);
  await page.keyboard.press("ArrowRight");
  await expect
    .poll(() => toolCapture.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0);
  for (const name of [
    "Approvals product capture",
    "Cleanup scenario agent reply",
  ]) {
    const replyCapture = page.getByRole("region", { name, exact: true });
    await replyCapture.focus();
    await expectVisibleFocusOutline(replyCapture);
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
