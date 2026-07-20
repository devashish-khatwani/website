import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { access } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { brandAssets } from "../../src/lib/design-system";

const websiteRoot = process.cwd();
const approvedPalette = new Set([
  "#0A0A0A",
  "#171717",
  "#737373",
  "#E5E5E5",
  "#F2F2F2",
  "#F5F5F5",
  "#FAFAFA",
  "#FFFFFF",
  "#2563EB",
  "#1D4ED8",
  "#DBEAFE",
  "#EFF6FF",
  "#1E3A8A",
  "#525252",
  "#60A5FA",
]);
const hexColorPattern = /#[0-9A-Fa-f]{6}/gu;
const assetFileNames = [
  "glaux-lockup.svg",
  "glaux-mark.svg",
  "glaux-mark-reversed.svg",
] as const;
// Hashes pin the parent-approved Glaux source assets without requiring the
// standalone website checkout to have the parent docs tree.
const approvedAssetHashes = {
  "glaux-lockup.svg":
    "51019811cac765c90bf4eaac35933a6d98446b58a749d83b2ba7f36f85f4dc41",
  "glaux-mark.svg":
    "516bec3d9b51699637e1a6c8585789ebb09354cc06f8ff7e62d562226ab2a29d",
  "glaux-mark-reversed.svg":
    "6b54189748d9522144d12be3343a515835685584d347b23941ec5b110aadf1db",
} as const satisfies Record<(typeof assetFileNames)[number], string>;

function sha256(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

describe("W-03 design token contract", () => {
  const css = readFileSync(
    join(websiteRoot, "src", "styles", "global.css"),
    "utf8",
  );

  it("defines the approved Glaux production palette as CSS tokens", () => {
    expect(css).toMatch(/--color-graphite:\s*#0a0a0a;/u);
    expect(css).toMatch(/--color-carbon:\s*#171717;/u);
    expect(css).toMatch(/--color-concrete:\s*#737373;/u);
    expect(css).toMatch(/--color-hairline:\s*#e5e5e5;/u);
    expect(css).toMatch(/--color-mist:\s*#f2f2f2;/u);
    expect(css).toMatch(/--color-chalk:\s*#ffffff;/u);
    expect(css).toMatch(/--color-primary:\s*#2563eb;/u);
  });

  it("keeps runtime brand assets limited to rendering fields", async () => {
    for (const asset of Object.values(brandAssets)) {
      await access(join(websiteRoot, "public", asset.src));
      expect(Object.keys(asset).sort()).toEqual([
        "alt",
        "height",
        "src",
        "width",
      ]);
    }
  });

  it("keeps the copied SVG assets pinned source-geometry embeds", () => {
    for (const assetName of assetFileNames) {
      const copiedSvg = readFileSync(
        join(websiteRoot, "public", "brand", assetName),
        "utf8",
      );

      expect(sha256(copiedSvg)).toBe(approvedAssetHashes[assetName]);
      expect(copiedSvg).toContain("<image");
      expect(copiedSvg).toContain("data:image/png;base64");
      expect(copiedSvg).not.toContain("<path");
    }
  });
});

describe("W-03 global CSS contract", () => {
  const css = readFileSync(
    join(websiteRoot, "src", "styles", "global.css"),
    "utf8",
  );

  it("defines focus-visible and reduced-motion defaults", () => {
    expect(css).toMatch(/:focus-visible/u);
    expect(css).toMatch(/outline:\s*2px solid var\(--color-graphite\)/u);
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/u);
    expect(css).toMatch(/scroll-behavior:\s*auto/u);
  });

  it("uses only approved colors and no gradients", () => {
    expect(css).not.toMatch(/linear-gradient|radial-gradient|conic-gradient/u);
    const cssColors = css
      .match(hexColorPattern)
      ?.map((color) => color.toUpperCase());
    expect(cssColors?.every((color) => approvedPalette.has(color))).toBe(true);
  });

  it("sets 44px minimum touch targets for interactive primitives", () => {
    expect(css).toMatch(/\.button/u);
    expect(css).toMatch(/min-block-size:\s*44px/u);
    expect(css).toMatch(/\.brand-logo/u);
    expect(css).toMatch(/min-inline-size:\s*44px/u);
  });
});
