import type { PageMetadata } from "./content/schemas.ts";

type SiteEnvironment = Readonly<Record<string, string | undefined>>;

const defaultCanonicalSiteOrigin = "https://www.glauxagent.com";
const defaultAppOrigin = "https://app.glauxagent.com";
const productionBranch = "main";

export const publishedRoutes = [] as const;

export const productNavigation = [
  {
    label: "Product overview",
    href: "/product/",
    description: "What employees and administrators can do with Glaux.",
  },
  {
    label: "How it works",
    href: "/how-it-works/",
    description:
      "Follow a request from approved context to a reviewable result.",
  },
  {
    label: "Security",
    href: "/security/",
    description: "See how rules, access, approvals, and activity stay visible.",
  },
] as const;

export const primaryNavigation = [
  { label: "Install", href: "/install/" },
  { label: "Plans", href: "/plans/" },
  { label: "Company", href: "/company/" },
] as const;

export const footerNavigation = [
  { label: "Product", href: "/product/" },
  { label: "How it works", href: "/how-it-works/" },
  { label: "Security", href: "/security/" },
  ...primaryNavigation,
] as const;

type PageMetadataForHead = Pick<
  PageMetadata,
  "title" | "description" | "canonicalPath" | "og"
>;

function getHttpsOrigin(
  value: string,
  variableName: "PUBLIC_SITE_ORIGIN" | "PUBLIC_APP_ORIGIN",
): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${variableName} must be an absolute https origin.`);
  }

  if (url.protocol !== "https:") {
    throw new Error(`${variableName} must be an absolute https origin.`);
  }

  if (
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      `${variableName} must be an origin without a path, query, or hash.`,
    );
  }

  return url.origin;
}

export function getCanonicalSiteOrigin(
  environment: SiteEnvironment = process.env,
): string {
  const configuredOrigin =
    environment.PUBLIC_SITE_ORIGIN?.trim() || defaultCanonicalSiteOrigin;

  return getHttpsOrigin(configuredOrigin, "PUBLIC_SITE_ORIGIN");
}

export function getAppOrigin(
  environment: SiteEnvironment = process.env,
): string {
  const configuredOrigin =
    environment.PUBLIC_APP_ORIGIN?.trim() || defaultAppOrigin;

  return getHttpsOrigin(configuredOrigin, "PUBLIC_APP_ORIGIN");
}

export function buildAppLoginUrl(
  environment: SiteEnvironment = process.env,
): string {
  return new URL("/login", `${getAppOrigin(environment)}/`).toString();
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
