import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { assert, expect, test, vi } from "vitest";
import ProductSection from "../../src/components/ProductSection.astro";
import {
  models,
  traces,
  automation,
  connections,
} from "../../src/lib/content/product-mocks";

import {
  ownTraces,
  workspaceTraces,
} from "../../src/lib/content/product-mock-dataset";

vi.mock("../../src/lib/content/product-section", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("../../src/lib/content/product-section")
    >();
  const copy = structuredClone(original.productSection);
  assert(copy.panes[1]);
  assert(copy.comingSoon.items[0]);
  copy.panes[1].name = "Edited directory name";
  copy.panes[1].summary = "Edited directory summary";
  copy.comingSoon.items[0].teaser = "Edited future teaser";
  return { ...original, productSection: copy };
});

test("Observability opens with a full week for Maya and the workspace", () => {
  expect(ownTraces).toHaveLength(72);
  expect(workspaceTraces).toHaveLength(288);
});

test("server renders complete default examples and uses shared product copy", async () => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(ProductSection);
  expect(html).toContain("Edited directory name");
  expect(html).toContain("Edited directory summary");
  expect(html).toContain("Edited future teaser");
  expect(html).toContain("18,204 rows deleted");
  expect(html).toContain("Not granted");
  expect(html.match(/<nav\b/gu)).toHaveLength(2);
  expect(html).not.toMatch(
    /A closer look at the work|Scroll inside the capture|Website product guide/u,
  );
});

test("example costs, grants and distinct manual and scheduled runs agree", () => {
  expect(
    models.reduce((total, model) => total + Math.round(model.spend * 100), 0),
  ).toBe(128450);
  const denied = connections[0].tools
    .filter((tool) => !tool.allowed)
    .map((tool) => tool.name);
  expect(denied).toEqual(["drop_table", "alter_table"]);
  expect(traces[0].timeline.at(-1)?.blocked).toBe(true);
  expect(automation.trace.id).not.toBe(traces[0].id);
  expect(automation.trace.timeline[3]?.outcome).toContain("4,112");
});
