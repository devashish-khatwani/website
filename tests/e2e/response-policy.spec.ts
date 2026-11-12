import { expect, test, type APIResponse } from "@playwright/test";
import { blogPosts } from "./blog-posts";

const baselineSecurityHeaders = {
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
} as const;

function expectBaselineSecurityHeaders(response: APIResponse): void {
  const headers = response.headers();

  expect(headers["strict-transport-security"]).toBe(
    "max-age=63072000; includeSubDomains",
  );
  expect(headers["permissions-policy"]).toContain("camera=()");
  expect(headers["permissions-policy"]).toContain("geolocation=()");
  expect(headers["permissions-policy"]).toContain("microphone=()");

  for (const [name, expectedValue] of Object.entries(baselineSecurityHeaders)) {
    expect(headers[name]).toBe(expectedValue);
  }
}

function expectHtmlIsNotBroadlyCached(response: APIResponse): void {
  const cacheControl = response.headers()["cache-control"] ?? "";
  const directives = cacheControl
    .split(",")
    .map((directive) => directive.trim().toLowerCase());

  expect(directives).not.toContain("immutable");

  for (const directive of directives) {
    const freshness = /^(?:s-maxage|max-age)=(\d+)$/u.exec(directive);
    if (freshness !== null) {
      expect(Number(freshness[1])).toBe(0);
    }
  }
}

for (const path of [
  "/",
  "/blog/",
  ...blogPosts.map(({ slug }) => `/blog/${slug}/`),
]) {
  test(`Cloudflare Pages applies the baseline policy without broadly caching ${path}`, async ({
    request,
  }) => {
    const response = await request.get(path);

    expect(response.status()).toBe(200);
    expectBaselineSecurityHeaders(response);
    expectHtmlIsNotBroadlyCached(response);
    expect(response.headers()).not.toHaveProperty("content-security-policy");
  });
}

test("Cloudflare Pages keeps the contact surface out of shared caches", async ({
  request,
}) => {
  const exactContactResponse = await request.get("/contact", {
    maxRedirects: 0,
  });
  const contactResponse = await request.get("/contact/");

  expect(exactContactResponse.status()).toBe(308);
  expect(exactContactResponse.headers()["location"]).toBe("/contact/");
  expectBaselineSecurityHeaders(exactContactResponse);
  expect(exactContactResponse.headers()["cache-control"]).toBe("no-store");
  expect(contactResponse.status()).toBe(200);
  expectBaselineSecurityHeaders(contactResponse);
  expect(contactResponse.headers()["cache-control"]).toBe("no-store");
});

test("Cloudflare Pages caches an emitted fingerprinted asset as immutable", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const assetPath = await page
    .locator('link[rel="stylesheet"][href^="/_astro/"]')
    .first()
    .getAttribute("href");

  expect(assetPath).toMatch(
    /^\/_astro\/[^/?]+\.[A-Za-z0-9_-]{8}\.(?:css|js)$/u,
  );

  const assetResponse = await request.get(assetPath ?? "");

  expect(assetResponse.status()).toBe(200);
  expectBaselineSecurityHeaders(assetResponse);
  expect(assetResponse.headers()["cache-control"]).toBe(
    "public, max-age=31536000, immutable",
  );
});
