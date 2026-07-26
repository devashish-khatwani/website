import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const websiteRoot = resolve(import.meta.dirname, "../..");

function readSource(path: string): string {
  return readFileSync(resolve(websiteRoot, path), "utf8");
}

describe("contact data boundary", () => {
  it("keeps website-owned contact code out of logging, storage, and custom processor paths", () => {
    const contactPage = readSource("src/pages/contact.astro");
    const contactConfig = readSource("src/lib/contact-form.ts");
    const combined = `${contactPage}\n${contactConfig}`;

    expect(combined).not.toMatch(
      /\b(console\.(?:log|info|warn|error|debug)|localStorage|sessionStorage|indexedDB|caches\.open|navigator\.sendBeacon|XMLHttpRequest)\b/u,
    );
    expect(combined).not.toMatch(
      /\bfetch\s*\(|\/submissions\/v3\/integration\/submit|api\.hsforms\.com|forms\/v2|hubspotutk|__hstc|__hssc|__hssrc/u,
    );
    expect(combined).not.toMatch(
      /PRIVATE_HUBSPOT|HUBSPOT_ACCESS_TOKEN|HUBSPOT_API_KEY|client_secret|authorization|bearer/u,
    );
    expect(contactPage).toContain('referrerPolicy="no-referrer"');
  });

  it("documents the remaining external operator-log and legal boundaries as open", () => {
    const boundary = readSource("docs/security/contact-data-boundary.md");
    const normalizedBoundary = boundary.replace(/\s+/gu, " ");

    expect(normalizedBoundary).toContain(
      "website-owned source/build/runtime boundary",
    );
    expect(normalizedBoundary).toContain("does not prove HubSpot account logs");
    expect(normalizedBoundary).toContain("Cloudflare platform logs");
    expect(normalizedBoundary).toContain("retention/deletion rules");
    expect(normalizedBoundary).toContain("final privacy/legal approval");
  });
});
