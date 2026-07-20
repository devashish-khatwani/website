import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./assertions";

const removedLegalRoutes = ["/privacy/", "/cookies/", "/terms/"] as const;

test.describe("removed legal routes", () => {
  for (const route of removedLegalRoutes) {
    test(`${route} returns the branded 404 page`, async ({ page }) => {
      const response = await page.goto(route);

      expect(response?.status()).toBe(404);
      await expect(page).toHaveTitle("Page not found | Glaux");
      await expect(
        page.getByRole("heading", { name: "This page isn’t here." }),
      ).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        "noindex, nofollow",
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
    });
  }

  test("the public shell exposes no legal navigation", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("contentinfo").getByRole("navigation", { name: "Legal" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: /Privacy|Cookie policy|Terms/u }),
    ).toHaveCount(0);
  });
});
