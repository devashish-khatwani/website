import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./assertions";

test("product overview keeps its metadata, shared example mocks, demo, and security link", async ({
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
  const previews = page.getByRole("region", {
    name: "Glaux product previews",
    exact: true,
  });
  await expect(previews.locator("[data-mock-preview]")).toHaveCount(2);
  await expect(previews).toContainText("Example data");
  await expect(page.locator('img[src^="/product/"]')).toHaveCount(0);
  await expect(page.getByText(/real product capture/iu)).toHaveCount(0);
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

test("retired product captures are no longer published", async ({
  request,
}) => {
  for (const asset of ["desktop-start.webp", "desktop-start-mobile.webp"])
    expect((await request.get(`/product/${asset}`)).status()).toBe(404);
});
