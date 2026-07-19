import { describe, expect, it } from "vitest";
import {
  buildPageHeadMetadata,
  buildRobotsTxt,
  buildSitemapXml,
  getCanonicalSiteOrigin,
  isSearchIndexingAllowed,
  publishedRoutes,
  siteStatus,
} from "../../src/lib/site";

describe("site bootstrap contract", () => {
  it("keeps the placeholder scoped to W-02 guardrails", () => {
    expect(siteStatus.name).toBe("Glaux");
    expect(siteStatus.title).toContain("bootstrap");
    expect(siteStatus.guardrails).toContain("No analytics yet");
    expect(siteStatus.guardrails).toContain("No auth logic");
    expect(siteStatus.guardrails.join(" ")).not.toMatch(/powered by hermes/i);
  });
});

describe("site discoverability metadata", () => {
  const description =
    "Draft home metadata used to validate the Glaux website content model before launch pages are published.";
  const homeMetadata = {
    title: "Glaux draft home content",
    description,
    canonicalPath: "/",
    og: {
      title: "Glaux draft home content",
      description,
      imageAlt: "Monochrome Glaux draft home social preview.",
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

    expect(pageHead.title).toBe("Glaux draft home content");
    expect(pageHead.description).toBe(description);
    expect(pageHead.canonicalUrl).toBe("https://www.glauxagent.com/");
    expect(pageHead.og).toMatchObject({
      title: "Glaux draft home content",
      description,
      url: "https://www.glauxagent.com/",
      type: "website",
    });
  });

  it("allows crawling only for an explicit Cloudflare Pages production build", () => {
    expect(publishedRoutes).toEqual([{ path: "/" }]);
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
    expect(buildSitemapXml()).toContain(
      "<loc>https://www.glauxagent.com/</loc>",
    );
  });
});
