import type { PageMetadata } from "./content/schemas.ts";

type SiteEnvironment = Readonly<Record<string, string | undefined>>;

const defaultCanonicalSiteOrigin = "https://www.glauxagent.com";
const productionBranch = "main";

export const publishedRoutes = ["/"] as const;

type PageMetadataForHead = Pick<
  PageMetadata,
  "title" | "description" | "canonicalPath" | "og"
>;

export const siteStatus = {
  name: "Glaux",
  title: "Glaux design foundation",
  description:
    "A static-first proof of the Glaux public website brand assets and design primitives.",
  statusLabel: "Design foundation",
  guardrails: [
    "Glaux-only branding",
    "Verified source assets",
    "Monochrome production palette",
    "44px interactive targets",
    "No analytics yet",
    "No auth logic",
    "No form backend",
    "No upstream Hermes branding",
  ],
} as const;

export function getCanonicalSiteOrigin(
  environment: SiteEnvironment = process.env,
): string {
  const configuredOrigin =
    environment.PUBLIC_SITE_ORIGIN?.trim() || defaultCanonicalSiteOrigin;

  let url: URL;

  try {
    url = new URL(configuredOrigin);
  } catch {
    throw new Error("PUBLIC_SITE_ORIGIN must be an absolute https origin.");
  }

  if (url.protocol !== "https:") {
    throw new Error("PUBLIC_SITE_ORIGIN must be an absolute https origin.");
  }

  if (
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "PUBLIC_SITE_ORIGIN must be an origin without a path, query, or hash.",
    );
  }

  return url.origin;
}

function absoluteSiteUrl(
  path: string,
  environment: SiteEnvironment = process.env,
): string {
  if (!path.startsWith("/")) {
    throw new Error("Site paths must be root-relative.");
  }

  return new URL(path, `${getCanonicalSiteOrigin(environment)}/`).toString();
}

function escapeXmlTextContent(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function isSearchIndexingAllowed(
  environment: SiteEnvironment = process.env,
): boolean {
  const isCloudflarePagesBuild =
    environment.CF_PAGES === "1" ||
    environment.CF_PAGES?.toLowerCase() === "true";

  return (
    isCloudflarePagesBuild && environment.CF_PAGES_BRANCH === productionBranch
  );
}

export function buildPageHeadMetadata(
  page: PageMetadataForHead,
  environment: SiteEnvironment = process.env,
) {
  const canonicalUrl = absoluteSiteUrl(page.canonicalPath, environment);
  const imageUrl = page.og.image
    ? new URL(
        page.og.image,
        `${getCanonicalSiteOrigin(environment)}/`,
      ).toString()
    : undefined;

  return {
    title: page.title,
    description: page.description,
    canonicalUrl,
    og: {
      title: page.og.title,
      description: page.og.description,
      url: canonicalUrl,
      type: "website",
      ...(imageUrl
        ? {
            image: imageUrl,
            imageAlt: page.og.imageAlt,
          }
        : {}),
    },
  } as const;
}

export function buildRobotsTxt(
  environment: SiteEnvironment = process.env,
): string {
  const crawlRule = isSearchIndexingAllowed(environment)
    ? "Allow: /"
    : "Disallow: /";

  return [
    "User-agent: *",
    crawlRule,
    "",
    `Sitemap: ${absoluteSiteUrl("/sitemap.xml", environment)}`,
    "",
  ].join("\n");
}

export function buildSitemapXml(
  environment: SiteEnvironment = process.env,
): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...publishedRoutes.flatMap((path) => [
      "  <url>",
      `    <loc>${escapeXmlTextContent(absoluteSiteUrl(path, environment))}</loc>`,
      "  </url>",
    ]),
    "</urlset>",
    "",
  ].join("\n");
}
