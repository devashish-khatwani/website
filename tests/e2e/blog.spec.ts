import { expect, test } from "@playwright/test";
import { blogPosts } from "./blog-posts";

const origin = "https://www.glauxagent.com";
const isProductionPagesBuild =
  (process.env.CF_PAGES === "1" ||
    process.env.CF_PAGES?.toLowerCase() === "true") &&
  process.env.CF_PAGES_BRANCH === "main";

test("blog index presents all four published posts and shell navigation", async ({
  page,
}) => {
  const response = await page.goto("/blog/");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("Blog | Glaux");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${origin}/blog/`,
  );
  if (isProductionPagesBuild) {
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  } else {
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow",
    );
  }

  const cards = page.getByRole("main").getByRole("article");
  await expect(cards).toHaveCount(4);
  for (const post of blogPosts) {
    const card = cards.filter({
      has: page.getByRole("heading", { name: post.title, exact: true }),
    });
    await expect(
      card.getByRole("link", { name: post.title, exact: true }),
    ).toHaveAttribute("href", `/blog/${post.slug}/`);
    await expect(
      card.getByText(post.description, { exact: true }),
    ).toBeVisible();
    await expect(card.locator("time")).toHaveAttribute(
      "datetime",
      "2026-11-11",
    );
    await expect(card.locator("time")).toHaveText("November 11, 2026");
    await expect(card.getByRole("img", { name: post.heroAlt })).toHaveAttribute(
      "src",
      `/blog/images/${post.slug}/hero.svg`,
    );
  }

  const dates = await cards
    .locator("time")
    .evaluateAll((times) =>
      times.map((time) => time.getAttribute("datetime") ?? ""),
    );
  expect(dates).toEqual([...dates].sort().reverse());
  await expect(
    page
      .getByRole("navigation", { name: "Primary", exact: true })
      .getByRole("link", { name: "Blog", exact: true }),
  ).toHaveAttribute("href", "/blog/");
  await expect(
    page
      .getByRole("contentinfo")
      .getByRole("link", { name: "Blog", exact: true }),
  ).toHaveAttribute("href", "/blog/");
});

for (const post of blogPosts) {
  test(`${post.slug} publishes the supplied content and accessible images`, async ({
    page,
  }) => {
    const response = await page.goto(`/blog/${post.slug}/`);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(`${post.title} | Glaux`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      post.description,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${origin}/blog/${post.slug}/`,
    );
    if (isProductionPagesBuild) {
      await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    } else {
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        "noindex, nofollow",
      );
    }

    const article = page.getByRole("main").getByRole("article");
    await expect(article.getByRole("heading", { level: 1 })).toHaveText(
      post.title,
    );
    await expect(
      article.getByText("The Glaux Team", { exact: true }),
    ).toBeVisible();
    await expect(article.locator("time")).toHaveAttribute(
      "datetime",
      "2026-11-11",
    );
    await expect(article.locator("time")).toHaveText("November 11, 2026");
    await expect(
      article.getByRole("list", { name: "Tags" }).getByRole("listitem"),
    ).toHaveText([...post.tags]);

    const images = article.getByRole("img");
    await expect(images).toHaveCount(3);
    await expect(images.first()).toHaveAttribute("alt", post.heroAlt);
    for (const image of await images.all()) {
      await expect(image).toHaveAttribute("alt", /\S/u);
      await expect(image).toHaveAttribute(
        "src",
        new RegExp(`^/blog/images/${post.slug}/[^/]+\\.svg$`, "u"),
      );
      await image.scrollIntoViewIfNeeded();
      await expect(image).toBeVisible();
      await expect
        .poll(() =>
          image.evaluate(
            (element: HTMLImageElement) =>
              element.complete && element.naturalWidth > 0,
          ),
        )
        .toBe(true);
    }
  });
}

test("checklist links directly to the published audit post", async ({
  page,
}) => {
  await page.goto("/blog/ai-usage-policy-checklist/");
  const link = page.getByRole("main").getByRole("link", {
    name: "What an audit trail for AI agents should capture",
    exact: true,
  });
  await expect(link).toHaveAttribute(
    "href",
    "/blog/audit-trail-for-ai-agents/",
  );
  await link.click();
  await expect(page).toHaveURL(/\/blog\/audit-trail-for-ai-agents\/$/u);
});

test("sitemap includes the blog index and all four published posts", async ({
  request,
}) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  for (const path of [
    "/blog/",
    ...blogPosts.map(({ slug }) => `/blog/${slug}/`),
  ]) {
    expect(xml).toContain(`<loc>${origin}${path}</loc>`);
  }
});
