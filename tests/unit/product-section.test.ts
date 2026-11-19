import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { assert, expect, test, vi } from "vitest";
import ProductSection from "../../src/components/ProductSection.astro";

vi.mock("../../src/lib/content/product-section", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("../../src/lib/content/product-section")
    >();
  const copy = structuredClone(original.productSection);
  copy.statement = "A platform statement edited by the copy author.";
  const feature = copy.panes[0];
  assert(feature);
  feature.name = "Edited feature";
  feature.summary = "An edited feature explanation.";
  feature.headline = "An edited deep dive.";
  feature.explanation = ["Edited first line.", "Edited second line."];
  feature.flow = [
    "Edited first step",
    "Edited second step",
    "Edited third step",
  ];
  if (feature.capture) feature.capture.alt = "An edited capture description.";
  const soon = copy.comingSoon.items[0];
  assert(soon);
  soon.name = "Edited future feature";
  soon.teaser = "An edited future teaser.";
  return { ...original, productSection: copy };
});

test("renders author edits across the whole feature guide with a complete no-JS fallback", async () => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(ProductSection);
  for (const text of [
    "A platform statement edited by the copy author.",
    "Edited feature",
    "An edited feature explanation.",
    "An edited deep dive.",
    "Edited first line.",
    "Edited second line.",
    "Edited first step",
    "Edited second step",
    "Edited third step",
    "An edited capture description.",
    "Edited future feature",
    "An edited future teaser.",
  ]) {
    expect(html).toContain(text);
  }
  expect(html.match(/data-feature-panel[\s>]/gu)).toHaveLength(7);
  expect(html.match(/data-feature-detail[\s>]/gu)).toHaveLength(7);
  const panels = [
    ...html.matchAll(/<article\b[^>]*data-feature-panel[^>]*>/gu),
  ];
  expect(panels).toHaveLength(7);
  for (const panel of panels)
    expect(panel[0]).not.toMatch(/\shidden(?:\s|=|>)/u);
  const soonGroups = [
    ...html.matchAll(/<ul[^>]*data-coming-soon[^>]*>(.*?)<\/ul>/gsu),
  ];
  expect(soonGroups).toHaveLength(2);
  for (const group of soonGroups) {
    expect(group[1]).not.toMatch(/<(?:a|button|img)\b/u);
  }
});
