import { expect, test } from "@playwright/test";
import {
  expectNoHorizontalOverflow,
  expectVisibleFocusOutline,
} from "./assertions";

const features = [
  "Connected Tools",
  "Skills",
  "Desktop app",
  "Own machine",
  "My traces",
  "Team traces",
  "Access & approvals",
  "Audit",
];

for (const route of ["/", "/product/"]) {
  test(`${route} feature guide switches real captures and text panels by keyboard`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route);
    const guide = page.locator("[data-product-section]");
    const nav = guide.getByRole("navigation", { name: "Glaux features" });
    const captureSources = new Set<string>();
    for (const name of features) {
      const link = nav.getByRole("link", { name, exact: true });
      await link.focus();
      await expectVisibleFocusOutline(link);
      await page.keyboard.press("Enter");
      await expect(link).toHaveAttribute("aria-current", "true");
      const panel = guide.locator("[data-feature-panel]:visible");
      await expect(panel).toHaveCount(1);
      await expect(
        panel.getByRole("heading", { name, exact: true }),
      ).toBeVisible();
      await expectVisibleFocusOutline(panel);
      await expect(panel.getByRole("listitem")).toHaveCount(3);
      if (["Skills", "My traces", "Team traces"].includes(name)) {
        await expect(panel.getByRole("img")).toHaveCount(0);
        await expect(panel).toContainText("Feature walkthrough · text only.");
      } else {
        const capture = panel.getByRole("img");
        await expect(capture).toBeVisible();
        const source = (await capture.getAttribute("src")) ?? "";
        expect(source).toBeTruthy();
        expect(captureSources.has(source)).toBe(false);
        captureSources.add(source);
        await expect
          .poll(() =>
            capture.evaluate(
              (image: HTMLImageElement) =>
                image.complete && image.naturalWidth > 0,
            ),
          )
          .toBe(true);
      }
      await expect(
        panel.getByRole("link", { name: "More about this feature" }),
      ).toHaveAttribute("href", /^#detail-/u);
    }
    await guide
      .locator(".product-pillars")
      .getByRole("link", { name: "Desktop app" })
      .click();
    await expect(
      nav.getByRole("link", { name: "Desktop app", exact: true }),
    ).toHaveAttribute("aria-current", "true");
    await expect(guide.locator("[data-feature-panel]:visible")).toContainText(
      "Start a session",
    );
    await expect(guide.locator("[data-feature-detail]")).toHaveCount(8);
    const soonGroups = guide.locator("[data-coming-soon]");
    await expect(soonGroups).toHaveCount(2);
    for (const group of await soonGroups.all()) {
      await expect(group.getByRole("listitem")).toHaveCount(4);
      await expect(group.getByRole("link")).toHaveCount(0);
      await expect(group.getByRole("button")).toHaveCount(0);
      for (const name of [
        "Knowledge Hub",
        "Guardrails",
        "Model Studio",
        "Eval Engine",
      ]) {
        const row = group.getByRole("listitem").filter({ hasText: name });
        await expect(row).toContainText("Soon");
        await row.click();
        await expect(
          nav.getByRole("link", { name: "Desktop app", exact: true }),
        ).toHaveAttribute("aria-current", "true");
      }
    }
  });

  test(`${route} feature guide remains complete without JavaScript`, async ({
    browser,
    baseURL,
  }) => {
    if (!baseURL) throw new Error("The website preview URL is required.");
    const context = await browser.newContext({
      javaScriptEnabled: false,
      baseURL,
    });
    const page = await context.newPage();
    await page.goto(route);
    const guide = page.locator("[data-product-section]");
    await expect(guide.locator("[data-feature-panel]:visible")).toHaveCount(8);
    for (const panel of await guide.locator("[data-feature-panel]").all()) {
      await expect(panel.getByRole("listitem")).toHaveCount(3);
      await expect(
        panel.getByRole("link", { name: "More about this feature" }),
      ).toHaveCount(1);
    }
    await expect(guide.locator("[data-feature-detail]")).toHaveCount(8);
    await context.close();
  });
}

test("feature guide stacks and keeps wide captures locally scrollable at all requested widths", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const guide = page.locator("[data-product-section]");
    const nav = guide.getByRole("navigation", { name: "Glaux features" });
    for (const name of [
      "Connected Tools",
      "Desktop app",
      "Own machine",
      "My traces",
      "Access & approvals",
      "Audit",
    ]) {
      await nav.getByRole("link", { name, exact: true }).click();
      await expectNoHorizontalOverflow(page);
      const capture = guide.locator(
        "[data-feature-panel]:visible .feature-capture",
      );
      if (width <= 390 && (await capture.count())) {
        await page.keyboard.press("Tab");
        await page.keyboard.press("ArrowRight");
        await expectVisibleFocusOutline(capture);
        await expect
          .poll(() => capture.evaluate((element) => element.scrollLeft))
          .toBeGreaterThan(0);
      }
    }
  }
});
