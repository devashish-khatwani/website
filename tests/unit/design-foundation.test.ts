import { readFileSync } from "node:fs";
import { access } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { brandAssets, previewBadges } from "../../src/lib/design-system";

const websiteRoot = process.cwd();
const approvedPalette = new Set([
  "#0A0A0A",
  "#171717",
  "#737373",
  "#E5E5E5",
  "#F2F2F2",
  "#FFFFFF",
]);
const hexColorPattern = /#[0-9A-Fa-f]{6}/gu;

describe("W-03 design token contract", () => {
  const css = readFileSync(
    join(websiteRoot, "src", "styles", "global.css"),
    "utf8",
  );

  it("defines the approved monochrome production palette as CSS tokens", () => {
    expect(css).toMatch(/--color-graphite:\s*#0a0a0a;/u);
    expect(css).toMatch(/--color-carbon:\s*#171717;/u);
    expect(css).toMatch(/--color-concrete:\s*#737373;/u);
    expect(css).toMatch(/--color-hairline:\s*#e5e5e5;/u);
    expect(css).toMatch(/--color-mist:\s*#f2f2f2;/u);
    expect(css).toMatch(/--color-chalk:\s*#ffffff;/u);
  });

  it("documents raster-in-SVG provenance for every Glaux brand asset", async () => {
    for (const asset of Object.values(brandAssets)) {
      await access(join(websiteRoot, "public", asset.src));
      expect(asset.provenance).toContain("docs/website/assets/");
      expect(asset.geometryPolicy).toBe("preserve-source-geometry");
    }

    expect(brandAssets.lockup.kind).toBe("raster-embedded-svg");
    expect(brandAssets.mark.kind).toBe("raster-embedded-svg");
    expect(brandAssets.reversedMark.kind).toBe("raster-embedded-svg");
  });

  it("keeps the copied SVG assets as source-geometry embeds rather than traced redraws", () => {
    for (const assetName of [
      "glaux-lockup.svg",
      "glaux-mark.svg",
      "glaux-mark-reversed.svg",
    ]) {
      const svg = readFileSync(
        join(websiteRoot, "public", "brand", assetName),
        "utf8",
      );

      expect(svg).toContain("<image");
      expect(svg).toContain("data:image/png;base64");
      expect(svg).not.toContain("<path");
    }
  });

  it("labels launch maturity badges without inventing availability states", () => {
    expect(previewBadges.map((badge) => badge.label)).toEqual([
      "Skill Hub Preview",
      "Enterprise MCP Preview",
      "Observability Preview",
      "Build your own model Coming soon",
    ]);
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

  it("does not introduce gradients or decorative chromatic colors", () => {
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
