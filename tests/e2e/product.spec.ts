import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./assertions";

test("product overview keeps its metadata, real desktop capture, demo, and security link", async ({
  page,
}) => {
  await page.goto("/product/");
  await expect(page).toHaveTitle(/Product \| Glaux/u);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://www.glauxagent.com/product/",
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "From question to useful outcome.",
  );
  const capture = page.getByRole("img", {
    name: "The real Glaux desktop app, ready for a new work session.",
    exact: true,
  });
  await expect(capture).toHaveAttribute("src", "/product/desktop-start.webp");
  await expect
    .poll(() =>
      capture.evaluate(
        (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
      ),
    )
    .toBe(true);
  await expect(
    page.getByRole("main").getByRole("link", { name: "Book a demo" }).first(),
  ).toHaveAttribute("href", "https://www.glauxagent.com/contact/");
  await expect(
    page.getByRole("link", { name: "Open technical details" }),
  ).toHaveAttribute("href", "/security/");
  await expect(
    page.getByRole("heading", { name: "Give it the work. See every step." }),
  ).toBeVisible();
});

test("product overview has no horizontal overflow at the requested widths", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/product/");
    await expectNoHorizontalOverflow(page);
  }
});
