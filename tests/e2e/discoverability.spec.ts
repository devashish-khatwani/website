import { expect, test } from "@playwright/test";
import {
  expectNoHorizontalOverflow,
  expectVisibleFocusOutline,
} from "./assertions";

const legalDraftRoutes = [
  {
    path: "/privacy/",
    title: "Privacy draft | Glaux",
    description: "Draft Glaux privacy route pending legal approval.",
  },
  {
    path: "/cookies/",
    title: "Cookie policy draft | Glaux",
    description:
      "Draft Glaux cookie and analytics route pending legal approval.",
  },
  {
    path: "/terms/",
    title: "Terms draft | Glaux",
    description: "Draft Glaux terms route pending legal approval.",
  },
] as const;

test("unknown routes return the branded W-13 404 recovery page", async ({
  page,
}) => {
  const response = await page.goto("/does-not-exist/");

  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle("Page not found | Glaux");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "The Glaux page you requested may have changed or moved.",
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);

  await expect(page.getByRole("link", { name: "Glaux home" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "This page isn’t here." }),
  ).toBeVisible();
  await expect(
    page.getByText("The address may have changed, or the page may have moved."),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Go home" })).toHaveAttribute(
    "href",
    "/",
  );
  await expect(
    page.getByRole("link", { name: "View product" }),
  ).toHaveAttribute("href", "/product/");
});

test("404 recovery actions keep visible focus and avoid responsive overflow", async ({
  page,
}) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/missing-page/");
    await expectNoHorizontalOverflow(page);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/missing-page/");
  const homeLink = page.getByRole("link", { name: "Go home" });
  await homeLink.focus();
  await expectVisibleFocusOutline(homeLink);
});

for (const route of legalDraftRoutes) {
  test(`${route.path} keeps noindexed legal draft metadata with canonical URL`, async ({
    page,
  }) => {
    await page.goto(route.path);

    await expect(page).toHaveTitle(route.title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      route.description,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow",
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `https://www.glauxagent.com${route.path}`,
    );
  });
}
