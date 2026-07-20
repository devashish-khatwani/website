import { describe, expect, it } from "vitest";
import {
  buildPageHeadMetadata,
  buildAppLoginUrl,
  buildRobotsTxt,
  buildSitemapXml,
  getAppOrigin,
  getCanonicalSiteOrigin,
  isSearchIndexingAllowed,
  primaryNavigation,
  publishedRoutes,
} from "../../src/lib/site";

describe("site shell navigation contract", () => {
  it("keeps the primary navigation to the approved launch items", () => {
    expect(primaryNavigation.map((item) => item.label)).toEqual([
      "Product",
      "Security",
      "Company",
    ]);
    expect(primaryNavigation.map((item) => item.label)).not.toContain(
      "Resources",
    );
  });

  it("builds the sign-in handoff from an HTTPS app origin only", () => {
    expect(getAppOrigin()).toBe("https://app.glauxagent.com");
    expect(buildAppLoginUrl()).toBe("https://app.glauxagent.com/login");
    expect(
      buildAppLoginUrl({
        PUBLIC_APP_ORIGIN: "https://preview-app.example.com",
      }),
    ).toBe("https://preview-app.example.com/login");

    expect(() =>
      getAppOrigin({
        PUBLIC_APP_ORIGIN: "https://app.glauxagent.com/chat",
      }),
    ).toThrow(/must be an origin/u);

    expect(() =>
      getAppOrigin({
        PUBLIC_APP_ORIGIN: "http://app.glauxagent.com",
      }),
    ).toThrow(/must be an absolute https origin/u);
  });
});

describe("site discoverability metadata", () => {
  const description =
    "Glaux helps teams research, create, and automate with approved company knowledge and tools while keeping governance visible.";
  const homeMetadata = {
    title: "Glaux | Useful AI. Visible rules.",
    description,
    canonicalPath: "/",
    og: {
      title: "Glaux | Useful AI. Visible rules.",
      description,
      imageAlt: "Monochrome Glaux homepage product preview.",
    },
  };

  it("normalizes and validates the canonical site origin", () => {
    expect(getCanonicalSiteOrigin()).toBe("https://www.glauxagent.com");
    expect(
      getCanonicalSiteOrigin({
        PUBLIC_SITE_ORIGIN: "https://preview.example.com/",
      }),
    ).toBe("https://preview.example.com");

    expect(() =>
      getCanonicalSiteOrigin({
        PUBLIC_SITE_ORIGIN: "https://www.glauxagent.com/path",
      }),
    ).toThrow(/must be an origin/u);

    expect(() =>
      getCanonicalSiteOrigin({
        PUBLIC_SITE_ORIGIN: "http://www.glauxagent.com",
      }),
    ).toThrow(/must be an absolute https origin/u);
  });

  it("builds page canonical and Open Graph metadata from W-04 page data", () => {
    const pageHead = buildPageHeadMetadata(homeMetadata);

    expect(pageHead.title).toBe("Glaux | Useful AI. Visible rules.");
    expect(pageHead.description).toBe(description);
    expect(pageHead.canonicalUrl).toBe("https://www.glauxagent.com/");
    expect(pageHead.og).toMatchObject({
      title: "Glaux | Useful AI. Visible rules.",
      description,
      url: "https://www.glauxagent.com/",
      type: "website",
    });
    expect(pageHead.og).not.toHaveProperty("image");
    expect(pageHead.og).not.toHaveProperty("imageAlt");
  });

  it("resolves relative Open Graph images and preserves their alt text", () => {
    const pageHead = buildPageHeadMetadata({
      ...homeMetadata,
      og: {
        ...homeMetadata.og,
        image: "/social/home.png",
      },
    });

    expect(pageHead.og.image).toBe(
      "https://www.glauxagent.com/social/home.png",
    );
    expect(pageHead.og.imageAlt).toBe(homeMetadata.og.imageAlt);
  });

  it("preserves absolute HTTPS Open Graph image URLs", () => {
    const pageHead = buildPageHeadMetadata({
      ...homeMetadata,
      og: {
        ...homeMetadata.og,
        image: "https://cdn.example.com/home.png",
      },
    });

    expect(pageHead.og.image).toBe("https://cdn.example.com/home.png");
  });

  it("allows crawling only for an explicit Cloudflare Pages production build", () => {
    expect(publishedRoutes).toEqual([]);
    expect(isSearchIndexingAllowed({})).toBe(false);
    expect(
      isSearchIndexingAllowed({
        CF_PAGES: "1",
        CF_PAGES_BRANCH: "main",
      }),
    ).toBe(true);
    expect(
      isSearchIndexingAllowed({
        CF_PAGES: "1",
        CF_PAGES_BRANCH: "feature/w-13",
      }),
    ).toBe(false);

    expect(buildRobotsTxt({})).toContain("Disallow: /");
    expect(
      buildRobotsTxt({
        CF_PAGES: "1",
        CF_PAGES_BRANCH: "main",
      }),
    ).toContain("Allow: /");
    expect(buildSitemapXml()).not.toContain("<loc>");
  });
});
