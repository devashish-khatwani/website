import { expect, test } from "@playwright/test";

test("home page exposes the W-02 placeholder contract", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Glaux website bootstrap/);
  await expect(page.getByRole("link", { name: "Glaux home" })).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /Glaux public website bootstrap is ready/i,
    }),
  ).toBeVisible();
  await expect(page.getByText("No analytics yet")).toBeVisible();
  await expect(page.getByText(/Powered by Hermes Agent/i)).toHaveCount(0);
});
