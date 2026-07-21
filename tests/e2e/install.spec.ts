import { expect, test } from "@playwright/test";
import {
  expectNoHorizontalOverflow,
  expectVisibleFocusOutline,
} from "./assertions";

const canonicalUrl = "https://www.glauxagent.com/install/";

const featureImages = [
  [
    "/features/glaux-connect.svg?v=20260721",
    "A geometric agent connected to multiple work channels",
  ],
  [
    "/features/glaux-memory.svg?v=20260721",
    "Layered geometric facets converging into retained context",
  ],
  [
    "/features/glaux-schedule.svg?v=20260721",
    "A precise clock inside a recurring automation orbit",
  ],
  [
    "/features/glaux-delegate.svg?v=20260721",
    "One agent delegating work to three focused agents",
  ],
  [
    "/features/glaux-search.svg?v=20260721",
    "A search lens moving beyond a browser frame",
  ],
  [
    "/features/glaux-isolation.svg?v=20260721",
    "A protected execution cube enclosed by a policy boundary",
  ],
] as const;

test("install page renders draft metadata and desktop download options", async ({
  page,
}) => {
  await page.goto("/install/");

  await expect(page).toHaveTitle("Install Glaux | Glaux");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    canonicalUrl,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    canonicalUrl,
  );

  await expect(
    page.getByRole("heading", { name: "Put Glaux to work." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Get the desktop app" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Glaux desktop app downloads").getByText("macOS + Windows"),
  ).toBeVisible();

  await expect(
    page.getByRole("link", { name: "Download for macOS" }),
  ).toHaveAttribute("href", "#macos-download");
  await expect(
    page.getByRole("link", { name: "Download for Windows" }),
  ).toHaveAttribute("href", "#windows-download");
  await expect(
    page.getByLabel("Glaux desktop app downloads").getByRole("link"),
  ).toHaveCount(2);
});

test("install page keeps approved capability copy and vector feature assets", async ({
  page,
  request,
}) => {
  await page.goto("/install/");

  await expect(
    page.getByRole("heading", {
      name: "Built on Hermes. Ready for enterprise.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Every capability stays visible, policy-aware, and reviewable.",
    ),
  ).toBeVisible();

  for (const [src, alt] of featureImages) {
    const image = page.getByRole("img", { name: alt });
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute("src", src);

    const asset = await request.get(src);
    await expect(asset).toBeOK();
    expect(asset.headers()["content-type"]).toContain("image/svg+xml");
  }

  await expect(page.getByRole("main").locator("img")).toHaveCount(
    featureImages.length,
  );
});

test("install page excludes unsupported platform and terminal copy", async ({
  page,
}) => {
  await page.goto("/install/");

  await expect(page.getByRole("main")).not.toContainText(
    /Linux|terminal|CLI|command line|shell|requirements pending|public-domain|raster/iu,
  );
  await expect(page.getByText(/\.dmg package/u)).toBeVisible();
  await expect(page.getByText(/\.msi installer/u)).toBeVisible();
});

test("install page keeps focus visible for download and rollout actions", async ({
  page,
}) => {
  await page.goto("/install/");

  const macDownload = page.getByRole("link", { name: "Download for macOS" });
  const windowsDownload = page.getByRole("link", {
    name: "Download for Windows",
  });
  const rolloutLink = page.getByRole("link", {
    name: "Talk to us about rollout",
  });

  await macDownload.focus();
  await expectVisibleFocusOutline(macDownload);
  await page.keyboard.press("Tab");
  await expectVisibleFocusOutline(windowsDownload);
  await rolloutLink.focus();
  await expectVisibleFocusOutline(rolloutLink);
});

test("install page has no horizontal overflow on mobile, tablet, or desktop", async ({
  page,
}) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/install/");
    await expectNoHorizontalOverflow(page);
  }
});
