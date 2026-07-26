import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { describe, expect, it } from "vitest";

type HeaderRule = {
  pattern: string;
  headers: Map<string, string>;
};

const websiteRoot = process.cwd();
const sourceHeadersPath = join(websiteRoot, "public", "_headers");
const distHeadersPath = join(websiteRoot, "dist", "_headers");

function parseHeaderRules(source: string): HeaderRule[] {
  const rules: HeaderRule[] = [];
  let activeRule: HeaderRule | undefined;

  for (const rawLine of source.split(/\r?\n/u)) {
    if (rawLine.trim() === "" || rawLine.trimStart().startsWith("#")) {
      continue;
    }

    if (!/^\s/u.test(rawLine)) {
      activeRule = {
        pattern: rawLine.trim(),
        headers: new Map(),
      };
      rules.push(activeRule);
      continue;
    }

    const separator = rawLine.indexOf(":");
    if (!activeRule || separator === -1) {
      throw new Error(`Invalid _headers line: ${rawLine}`);
    }

    activeRule.headers.set(
      rawLine.slice(0, separator).trim().toLowerCase(),
      rawLine.slice(separator + 1).trim(),
    );
  }

  return rules;
}

function readSourceRules(): HeaderRule[] {
  return parseHeaderRules(readFileSync(sourceHeadersPath, "utf8"));
}

describe("W-15 Cloudflare Pages response policy", () => {
  it("sets baseline browser security headers on every static response", () => {
    const globalRule = readSourceRules().find(
      ({ pattern }) => pattern === "/*",
    );

    expect(globalRule).toBeDefined();
    expect(globalRule?.headers.get("strict-transport-security")).toMatch(
      /^max-age=(?:31536000|63072000); includeSubDomains$/u,
    );
    expect(globalRule?.headers.get("x-content-type-options")).toBe("nosniff");
    expect(globalRule?.headers.get("referrer-policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(globalRule?.headers.get("x-frame-options")).toBe("DENY");
    expect(globalRule?.headers.get("permissions-policy")).toMatch(
      /camera=\(\).*geolocation=\(\).*microphone=\(\)/u,
    );
  });

  it("keeps contact responses private without adding a premature CSP", () => {
    const rules = readSourceRules();
    const contactRule = rules.find(({ pattern }) => pattern === "/contact");
    const contactDescendantsRule = rules.find(
      ({ pattern }) => pattern === "/contact/*",
    );

    expect(contactRule?.headers.get("cache-control")).toBe("no-store");
    expect(contactDescendantsRule?.headers.get("cache-control")).toBe(
      "no-store",
    );
    expect(
      rules.every(({ headers }) => !headers.has("content-security-policy")),
    ).toBe(true);
  });

  it("adds long-lived caching only for Astro fingerprinted assets", () => {
    const rules = readSourceRules();
    const cacheRules = rules.filter(({ headers }) =>
      headers.has("cache-control"),
    );
    const assetRule = cacheRules.find(({ pattern }) => pattern === "/_astro/*");

    expect(assetRule?.headers.get("cache-control")).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(
      cacheRules
        .filter(({ headers }) => headers.get("cache-control") !== "no-store")
        .map(({ pattern }) => pattern),
    ).toEqual(["/_astro/*"]);

    const builtAssetsDirectory = join(websiteRoot, "dist", "_astro");
    if (existsSync(builtAssetsDirectory)) {
      const fingerprintedAssetName =
        /(?:^|\.)(?:[A-Za-z0-9_-]{8})(?=\.[^.]+$)/u;
      const builtAssets = readdirSync(builtAssetsDirectory, {
        recursive: true,
        withFileTypes: true,
      })
        .filter((entry) => entry.isFile())
        .map((entry) => basename(entry.name));

      expect(builtAssets.length).toBeGreaterThan(0);
      expect(
        builtAssets.every((assetName) =>
          fingerprintedAssetName.test(assetName),
        ),
      ).toBe(true);
    }
  });

  it("copies the exact source policy into the production build", () => {
    if (!existsSync(distHeadersPath)) {
      return;
    }

    expect(readFileSync(distHeadersPath, "utf8")).toBe(
      readFileSync(sourceHeadersPath, "utf8"),
    );
  });
});
