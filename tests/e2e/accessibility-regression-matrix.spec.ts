import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";
import { expectVisibleFocusOutline } from "./assertions";
import { blogPosts } from "./blog-posts";

const routes = [
  { path: "/", h1: "AI coworkers. Enterprise control." },
  { path: "/product/", h1: "From question to useful outcome." },
  { path: "/security/", h1: "You choose what Glaux can access and do." },
  {
    path: "/company/",
    h1: "Building useful AI work with visible control.",
  },
  { path: "/contact/", h1: "Tell us what your team wants AI to help with." },
  { path: "/install/", h1: "Put Glaux to work." },
  { path: "/plans/", h1: "Start focused. Scale with control." },
  { path: "/how-it-works/", h1: "From request to reviewable result." },
  { path: "/blog/", h1: "Blog" },
  ...blogPosts.map(({ slug, title }) => ({
    path: `/blog/${slug}/`,
    h1: title,
  })),
  { path: "/404", h1: "This page isn’t here." },
] as const;

const viewports = [
  { name: "phone", width: 390, height: 844, mobileNavigation: true },
  { name: "tablet", width: 768, height: 1024, mobileNavigation: true },
  { name: "desktop", width: 1440, height: 1000, mobileNavigation: false },
] as const;

const hubSpotScriptUrl = "https://js.hsforms.net/forms/embed/v2.js";
const productionContactUrl = `http://www.glauxagent.com:${
  process.env.GLAUX_PAGES_PORT ?? "8788"
}/contact/`;
const productLinks = [
  { name: "Product overview", href: "/product/" },
  { name: "How it works", href: "/how-it-works/" },
  { name: "Security", href: "/security/" },
] as const;
const primaryLinks = [
  { name: "Install", href: "/install/" },
  { name: "Plans", href: "/plans/" },
  { name: "Company", href: "/company/" },
  { name: "Blog", href: "/blog/" },
] as const;

async function expectNoHorizontalOverflowWithinTolerance(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );

  expect(overflow).toBeLessThanOrEqual(2);
}

async function expectExactlyOneVisibleH1(page: Page, expectedName: string) {
  const visibleH1Text = await page.locator("h1").evaluateAll((headings) =>
    headings
      .filter((heading) => {
        const element = heading as HTMLElement;
        const styles = window.getComputedStyle(element);
        return (
          styles.visibility !== "hidden" &&
          styles.display !== "none" &&
          element.offsetParent !== null
        );
      })
      .map((heading) => heading.textContent?.replace(/\s+/gu, " ").trim()),
  );

  expect(visibleH1Text).toEqual([expectedName]);
  await expect(
    page.getByRole("heading", { level: 1, name: expectedName }),
  ).toBeVisible();
}

async function expectSkipLinkReachesMain(page: Page) {
  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  const main = page.getByRole("main");

  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  await expectVisibleFocusOutline(skipLink);
  await page.keyboard.press("Enter");
  await expect(main).toBeFocused();
}

async function expectNavigationForViewport(
  page: Page,
  usesMobileNavigation: boolean,
) {
  if (usesMobileNavigation) {
    const details = page.locator("details.mobile-nav");
    const summary = page.getByLabel("Open navigation");
    await expect(summary).toBeVisible();
    await summary.focus();
    await expectVisibleFocusOutline(summary);
    await page.keyboard.press("Enter");
    await expect(details).toHaveAttribute("open", "");

    const mobileNavigation = page.getByRole("navigation", {
      name: "Mobile primary",
    });
    for (const link of [...productLinks, ...primaryLinks]) {
      await expect(
        mobileNavigation.getByRole("link", { name: link.name }),
      ).toHaveAttribute("href", link.href);
    }
    await page.keyboard.press("Tab");
    await expect(
      mobileNavigation.getByRole("link", { name: "Product overview" }),
    ).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(summary).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(details).not.toHaveAttribute("open", "");
    await expect(mobileNavigation).toBeHidden();
    return;
  }

  const primaryNavigation = page.getByRole("navigation", { name: "Primary" });
  const productDetails = page.locator("details.nav-dropdown");
  const productSummary = productDetails.locator("summary");
  await expect(primaryNavigation).toBeVisible();
  await productSummary.focus();
  await expectVisibleFocusOutline(productSummary);
  await page.keyboard.press("Enter");
  await expect(productDetails).toHaveAttribute("open", "");

  const productNavigation = page.getByRole("navigation", {
    name: "Product sections",
  });
  for (const link of productLinks) {
    await expect(
      productNavigation.getByRole("link", { name: link.name }),
    ).toHaveAttribute("href", link.href);
  }
  for (const link of primaryLinks) {
    await expect(
      primaryNavigation.getByRole("link", { name: link.name }),
    ).toHaveAttribute("href", link.href);
  }
  await expect(
    primaryNavigation.getByRole("link", { name: "Sign in" }),
  ).toHaveAttribute("href", "https://app.glauxagent.com/login");

  const demoLink = primaryNavigation.getByRole("link", { name: "Book a demo" });
  await expect(demoLink).toHaveAttribute("href", "/contact/");
  await demoLink.focus();
  await expectVisibleFocusOutline(demoLink);
  await productSummary.focus();
  await page.keyboard.press("Enter");
  await expect(productDetails).not.toHaveAttribute("open", "");
}

function collectUnexpectedConsoleErrors(page: Page) {
  const errors: ConsoleMessage[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message);
    }
  });
  return errors;
}

for (const route of routes) {
  for (const viewport of viewports) {
    test(`${route.path} has stable ${viewport.name} accessibility and responsive structure`, async ({
      page,
    }) => {
      const consoleErrors = collectUnexpectedConsoleErrors(page);

      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto(route.path);
      await expectExactlyOneVisibleH1(page, route.h1);
      await expect(page.getByRole("main")).toBeVisible();
      await expectNoHorizontalOverflowWithinTolerance(page);
      await expectSkipLinkReachesMain(page);
      await expectNavigationForViewport(page, viewport.mobileNavigation);
      expect(consoleErrors.map((message) => message.text())).toEqual([]);
    });
  }
}

test("reduced motion keeps launch pages stable without overflow or console errors", async ({
  page,
}) => {
  const consoleErrors = collectUnexpectedConsoleErrors(page);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");

  const productDetails = page.locator("details.nav-dropdown");
  await productDetails.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(productDetails).toHaveAttribute("open", "");
  await expect(productDetails.locator(".nav-dropdown__panel")).toBeVisible();
  const reducedDurations = await productDetails.evaluate((details) => {
    const parseDurations = (value: string) =>
      value.split(",").map((duration) => {
        const normalized = duration.trim();
        return normalized.endsWith("ms")
          ? Number.parseFloat(normalized)
          : Number.parseFloat(normalized) * 1000;
      });
    const panel = details.querySelector(".nav-dropdown__panel");
    const icon = details.querySelector("summary svg");

    return {
      animation: parseDurations(
        window.getComputedStyle(panel as Element).animationDuration,
      ),
      transition: parseDurations(
        window.getComputedStyle(icon as Element).transitionDuration,
      ),
    };
  });
  expect(Math.max(...reducedDurations.animation)).toBeLessThanOrEqual(0.01);
  expect(Math.max(...reducedDurations.transition)).toBeLessThanOrEqual(0.01);

  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of routes) {
    await page.goto(route.path);
    await expectExactlyOneVisibleH1(page, route.h1);
    await expectNoHorizontalOverflowWithinTolerance(page);
  }

  expect(consoleErrors.map((message) => message.text())).toEqual([]);
});

test("production-host contact form ready state remains stubbed and the page skip link works", async ({
  page,
}) => {
  const consoleErrors = collectUnexpectedConsoleErrors(page);

  await page.route(hubSpotScriptUrl, async (route) => {
    await route.fulfill({
      contentType: "text/javascript",
      body: `
        window.hbspt = {
          forms: {
            create(config) {
              const iframe = document.createElement("iframe");
              iframe.title = "Glaux demo request form";
              document.querySelector(config.target).append(iframe);
              window.dispatchEvent(new CustomEvent("hs-form-event:on-ready", {
                detail: { formId: config.formId }
              }));
            }
          }
        };
      `,
    });
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(productionContactUrl);

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Tell us what your team wants AI to help with.",
    }),
  ).toBeVisible();
  await expect(page.locator("#hubspot-demo-form-host iframe")).toHaveAttribute(
    "title",
    "Glaux demo request form",
  );
  await expect(page.locator("[data-hubspot-demo-form]")).toHaveAttribute(
    "data-state",
    "ready",
  );
  await expectNoHorizontalOverflowWithinTolerance(page);
  await expectSkipLinkReachesMain(page);
  expect(consoleErrors.map((message) => message.text())).toEqual([]);
});
