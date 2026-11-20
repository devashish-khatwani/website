import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  expectNoHorizontalOverflow,
  expectVisibleFocusOutline,
  expectMockCurrencyTotals,
} from "./assertions";

test("mock currency parts match totals on first paint and after scope, period and model filters", async ({
  browser,
  baseURL,
}) => {
  if (!baseURL) throw new Error("The preview URL is required.");
  for (const javaScriptEnabled of [false, true]) {
    const context = await browser.newContext({
      baseURL,
      javaScriptEnabled,
      reducedMotion: "reduce",
    });
    try {
      const page = await context.newPage();
      await page.goto("/product/#feature-observability");
      await expectMockCurrencyTotals(page);
      if (!javaScriptEnabled) continue;
      const observe = page.locator("[data-observe]");
      for (const scope of [
        "My traces",
        "Group: Engineering",
        "Workspace: Acme",
      ]) {
        await observe.getByRole("button", { name: scope, exact: true }).click();
        for (const period of ["1", "3", "7"]) {
          await observe.getByLabel("Observability period").selectOption(period);
          await expectMockCurrencyTotals(page);
        }
      }
      await observe
        .getByRole("button", { name: "Deep Dive", exact: true })
        .click();
      await observe
        .getByRole("button", { name: "Traces", exact: true })
        .click();
      const activeScope = observe.locator("[data-scope-panel]:visible");
      await activeScope.getByLabel("Search traces").fill("no-matching-trace");
      await expectMockCurrencyTotals(page);
      await activeScope.getByLabel("Search traces").fill("");
      const trace = activeScope
        .locator("tr[data-observe-record]:not([hidden])")
        .first();
      const traceCost = await trace.locator('[data-column="cost"]').innerText();
      await trace.getByRole("button").click();
      await expect(
        observe.locator("[data-detail]:visible [data-trace-cost]"),
      ).toHaveText(traceCost);
      await page.keyboard.press("Escape");
      await page
        .locator('[data-mock="admin"]')
        .getByRole("navigation")
        .getByRole("button", { name: "AI Gateway", exact: true })
        .click();
      const gateway = page.locator('[data-pane="ai-gateway"]');
      for (const period of ["7", "30", "90"]) {
        await gateway.getByLabel("Usage period").selectOption(period);
        for (const model of ["all", "GPT-4.1", "Gemini 2.5 Pro"]) {
          await gateway.getByLabel("Usage model").selectOption(model);
          await expectMockCurrencyTotals(page);
        }
      }
    } finally {
      await context.close();
    }
  }
});

const desktopNames = [
  "New session",
  "Capabilities",
  "My traces",
  "Artifacts",
  "Automations",
];
const adminNames = [
  "People and Access",
  "AI Gateway",
  "Skills",
  "Connected Tools",
  "Cloud agents",
  "Observability",
  "Audit",
];

for (const width of [390, 1440]) {
  test(`Cloud agents filters, instance storage and example files work at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/product/#feature-cloud-agents");
    const pane = page.locator('[data-pane="cloud-agents"]');
    const rows = pane.locator("[data-cloud-row]:visible");
    await expect(page.locator("#admin-view")).toBeFocused();
    await expect(
      pane.getByRole("heading", { name: "Cloud agents", exact: true }),
    ).toBeVisible();
    await expect(rows).toHaveCount(6);
    await expect(pane).toContainText("Production workspace");
    const search = pane.getByLabel("Search agents");
    await search.fill(" SAM@ACME.EXAMPLE ");
    await expect(rows).toHaveCount(2);
    await pane
      .getByLabel("Runtime status", { exact: true })
      .selectOption("Stopped");
    await expect(rows).toHaveCount(1);
    const stopped = pane.getByRole("button", {
      name: "View details for Sam Lee, agt-1028",
    });
    await stopped.click();
    const detail = pane.getByRole("region", {
      name: "agt-1028 instance detail, with example data",
    });
    await expect(detail).toBeFocused();
    await expect(detail).toContainText("A previous instance for Sam Lee");
    await expect(detail).toContainText("sam@acme.example");
    await expect(detail).toContainText("/workspace");
    await expect(detail).toContainText("/opt/data");
    await expect(detail.getByText(/Attachment not verified/)).toHaveCount(2);
    await detail
      .getByRole("button", { name: "Browse workspace files →" })
      .click();
    const files = detail.getByRole("region", {
      name: "Workspace files, with example data",
    });
    await expect(files).toBeVisible();
    await expect(files).toContainText(
      "Agent state is sensitive. Its files are not listed.",
    );
    await files.locator("summary").filter({ hasText: "outputs/" }).click();
    await files
      .locator("summary")
      .filter({ hasText: "release-readiness.md" })
      .click();
    await expect(files.locator("pre")).toContainText("Owner: Sam Lee");
    const downloadPromise = page.waitForEvent("download");
    await files.getByRole("link", { name: "Download example file" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("agt-1028-release-readiness.md");
    const path = await download.path();
    if (!path) throw new Error("The example download must be saved.");
    expect(await readFile(path, "utf8")).toContain(
      "No customer files are connected.",
    );
    await page.keyboard.press("Escape");
    await expect(detail).toBeHidden();
    await expect(stopped).toBeFocused();
    await search.fill("no such agent");
    await expect(rows).toHaveCount(0);
    await expect(
      pane.getByRole("status").filter({ hasText: "No agents match" }),
    ).toBeVisible();
    await search.fill("");
    await pane
      .getByLabel("Runtime status", { exact: true })
      .selectOption("Unknown");
    await expect(rows).toHaveCount(1);
    await rows.click();
    await expect(pane.locator("[data-detail]:visible")).toContainText(
      "We can’t confirm whether this instance is still running.",
    );
    await expectNoHorizontalOverflow(page);
  });
}

for (const route of ["/", "/product/"]) {
  test(`${route} mocks have one keyboard navigation each and a complete no-JS fallback`, async ({
    page,
    browser,
    baseURL,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route);
    for (const [kind, names] of [
      ["desktop", desktopNames],
      ["admin", adminNames],
    ] as const) {
      const frame = page.locator(`[data-mock="${kind}"]`);
      const nav = frame.getByRole("navigation");
      await expect(nav).toHaveCount(1);
      for (const name of names) {
        const button = nav.getByRole("button", {
          name,
          exact: name !== "New session",
        });
        await expect(button.locator("svg")).toBeVisible();
        await button.focus();
        await expectVisibleFocusOutline(button);
        await page.keyboard.press("Enter");
        await expect(button).toHaveAttribute("aria-pressed", "true");
        await expect(frame.locator("[data-pane]:visible")).toHaveCount(1);
        await expect(frame.getByRole("region").first()).toHaveAttribute(
          "aria-label",
          `${name}, with example data`,
        );
      }
      await expect(
        frame.getByText("Example data", { exact: true }),
      ).toBeVisible();
    }
    await expect(
      page.getByText("A closer look at the work.", { exact: true }),
    ).toHaveCount(0);
    if (!baseURL) throw new Error("The preview URL is required.");
    const context = await browser.newContext({
      javaScriptEnabled: false,
      baseURL,
    });
    const fallback = await context.newPage();
    await fallback.goto(route);
    await expect(fallback.locator('[data-pane="desktop-app"]')).toBeVisible();
    await expect(
      fallback.locator('[data-pane="connected-tools"]'),
    ).toBeVisible();
    await expect(fallback.locator('[data-pane="desktop-app"]')).toContainText(
      "18,204 rows deleted",
    );
    await expect(
      fallback.locator('[data-pane="connected-tools"]'),
    ).toContainText("Not granted");
    await context.close();
  });
}

test("desktop examples connect grants, traces, artifacts and the scheduled run", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#feature-desktop-app");
  const frame = page.locator('[data-mock="desktop"]');
  await frame
    .getByRole("button", { name: "Open trace →", exact: true })
    .click();
  const detail = frame.locator("[data-detail]:visible");
  await expect(detail).toContainText("tr_8f2c41");
  await expect(detail).toContainText(
    "drop_table isn't included in this database access. Nothing was changed.",
  );
  await page.keyboard.press("Escape");
  await expect(
    frame.getByRole("button", { name: /^Expired sessions cleanup/ }),
  ).toBeFocused();
  await frame
    .getByRole("button", { name: "Capabilities", exact: true })
    .click();
  await frame
    .getByRole("button", { name: "Connected tools", exact: true })
    .click();
  await frame.locator("summary").click();
  await expect(frame.locator("details")).toHaveAttribute("open", "");
  for (const tool of ["drop_table", "alter_table"])
    await expect(
      frame.locator("details li").filter({ hasText: tool }),
    ).toContainText("Not granted");
  await frame.getByRole("button", { name: "Artifacts", exact: true }).click();
  await frame.getByRole("button", { name: /cleanup-summary.md/ }).click();
  await expect(detail).toContainText("Removed 18,204 expired sessions");
  await page.keyboard.press("Escape");
  await expect(
    frame.getByRole("button", { name: /cleanup-summary.md/ }),
  ).toBeFocused();
  await frame.getByRole("button", { name: "Automations", exact: true }).click();
  await expect(frame.locator("[data-pane]:visible")).toContainText(
    "Mon, Nov 23",
  );
  await frame.getByRole("switch", { name: "Scheduled task active" }).click();
  await expect(frame.locator("[data-automation-status]")).toHaveText("Paused");
  await expect(frame.locator("[data-next-run]")).toHaveText(
    "Paused — no run scheduled",
  );
  await frame.getByRole("switch").click();
  await expect(frame.locator("[data-automation-status]")).toHaveText("Active");
  await frame
    .getByRole("button", { name: "Find this run in My traces →" })
    .click();
  await expect(detail).toContainText("tr_9b7e16");
  await expect(detail).toContainText("4,112 rows deleted");
  await expect(detail).not.toContainText("18,204");
});

test("admin examples show scoped outcomes, local model switches and event history", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#feature-people-access");
  const frame = page.locator('[data-mock="admin"]');
  await frame.getByRole("button", { name: /Sam Lee sam@acme.example/ }).click();
  await expect(frame.locator("[data-detail]:visible")).toContainText(
    "3 models · 3 skills",
  );
  await page.keyboard.press("Escape");
  await expect(
    frame.getByRole("button", { name: /Sam Lee sam@acme.example/ }),
  ).toBeFocused();
  await frame.getByRole("button", { name: "Groups", exact: true }).click();
  await expect(frame.locator("#mock-groups")).toContainText("3 members");
  await frame.getByRole("button", { name: "AI Gateway", exact: true }).click();
  await frame
    .getByRole("button", { name: "Configuration", exact: true })
    .click();
  await frame.getByRole("button", { name: /Claude Sonnet 4.5 Chat/ }).click();
  const model = frame.getByRole("switch", {
    name: "Claude Sonnet 4.5 available",
  });
  await model.click();
  await expect(model).toHaveAttribute("aria-checked", "false");
  await expect(frame.getByRole("status")).toHaveText(
    "Example only: nothing changes.",
  );
  await frame.getByRole("button", { name: "Skills", exact: true }).click();
  await frame
    .getByRole("button", { name: /Database cleanup checklist/ })
    .click();
  await expect(frame.locator("[data-detail]:visible")).toContainText(
    "SKILL.md",
  );
  await page.keyboard.press("Escape");
  await frame
    .getByRole("button", { name: "Connected Tools", exact: true })
    .click();
  await frame.getByRole("button", { name: /GitHub acme\/web/ }).click();
  await expect(frame.locator("[data-detail]:visible")).toContainText(
    "merge_pull_request",
  );
  await expect(frame.locator("[data-detail]:visible")).toContainText(
    "Not granted",
  );
  await frame
    .getByRole("button", { name: "Observability", exact: true })
    .click();
  await frame.getByRole("button", { name: "Deep Dive", exact: true }).click();
  await frame.getByRole("button", { name: "Traces", exact: true }).click();
  await expect(frame.locator("[data-scope-panel]:visible")).toContainText(
    "Audit export for Q4",
  );
  await expect(
    frame.locator("[data-scope-panel]:visible [data-open]:visible"),
  ).toHaveCount(72);
  await frame
    .getByRole("button", { name: "Group: Engineering", exact: true })
    .click();
  await expect(
    frame.locator("[data-scope-panel]:visible [data-open]:visible"),
  ).toHaveCount(168);
  await frame
    .getByRole("button", { name: /Sam Lee Expired sessions cleanup/ })
    .click();
  await expect(frame.locator("[data-detail]:visible")).toContainText(
    "tr_8f2c41",
  );
  await expect(frame.locator("[data-detail]:visible")).toContainText(
    "Prompts and tool data stay with the run",
  );
  await frame
    .getByRole("button", { name: "Workspace: Acme", exact: true })
    .click();
  await expect(
    frame.locator("[data-scope-panel]:visible [data-open]:visible"),
  ).toHaveCount(288);
  await frame.getByRole("button", { name: "Audit", exact: true }).click();
  const grant = frame.locator("details").filter({ hasText: "evt_31d9a07c" });
  await expect(grant).toHaveAttribute("open", "");
  await expect(grant).toContainText("Engineering: no access → list_tables");
  await grant.locator("summary").click();
  await expect(grant).not.toHaveAttribute("open", "");
});

for (const width of [390, 1440]) {
  test(`gateway and observability dashboards keep filters, budgets and scoped detail usable at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/product/#feature-ai-gateway");
    const frame = page.locator('[data-mock="admin"]');
    const gateway = frame.locator('[data-pane="ai-gateway"]');
    await expect(
      gateway.getByRole("button", { name: "Dashboard", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(gateway.getByLabel("Usage period")).toHaveValue("7");
    await expect(gateway.locator("[data-usage-kpi=requests]")).toHaveText(
      "29,965",
    );
    await expect(gateway.locator("[data-usage-kpi=spend]")).toHaveText(
      "$299.72",
    );
    await expect(gateway).toContainText("$1,284.50");
    await expect(gateway).toContainText("$715.50");
    await gateway.getByRole("button", { name: "Spend", exact: true }).click();
    await expect(
      gateway.getByRole("img", { name: "Spend over time, with example data" }),
    ).toBeVisible();
    await gateway.getByLabel("Usage period").selectOption("7");
    await expect(
      gateway.getByText("November 13–19, 2026", { exact: true }),
    ).toBeVisible();
    await gateway.getByLabel("Usage period").selectOption("custom");
    await gateway.getByLabel("Usage start date").fill("2026-11-20");
    await expect(gateway.getByRole("status")).toContainText(
      "Start date must be on or before end date",
    );
    await gateway.getByLabel("Usage period").selectOption("30");
    await gateway.getByLabel("Usage model").selectOption("GPT-4.1");
    await expect(
      gateway.getByRole("cell", { name: "$531.16", exact: true }),
    ).toBeVisible();
    await expect(gateway.locator(".dash-budget")).toContainText("$1,284.50");
    await gateway.getByLabel("Usage model").selectOption("Gemini 2.5 Pro");
    await expect(gateway.locator("[data-usage-kpi=spend]")).toHaveText("$0.00");
    await expect(
      gateway.getByText("0 failed requests", { exact: true }),
    ).toBeVisible();
    await gateway.getByLabel("Usage model").selectOption("all");
    await gateway.getByRole("button", { name: "Manage budget →" }).click();
    await expect(
      gateway.getByRole("button", { name: "Budgets & limits" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      gateway.getByText("Parallel requests", { exact: true }).locator(".."),
    ).toContainText("50");
    await gateway.getByRole("button", { name: "Routing policies" }).click();
    await gateway
      .getByRole("button", { name: /General assistant Priority/ })
      .click();
    await expect(gateway.locator("[data-detail]:visible")).toContainText(
      "GPT-4.1",
    );
    await page.keyboard.press("Escape");
    await frame
      .getByRole("button", { name: "Observability", exact: true })
      .click();
    const observability = frame.locator('[data-pane="observability"]');
    await expect(
      observability.getByRole("button", { name: "My traces", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      observability.getByRole("heading", { name: "Sessions", exact: true }),
    ).toBeVisible();
    await expect(observability).not.toContainText("Organization");
    await observability
      .getByRole("button", { name: "Group: Engineering", exact: true })
      .click();
    await observability
      .getByRole("button", { name: "Open Deep Dive →" })
      .click();
    await expect(
      observability.getByRole("button", { name: "Sessions", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await observability
      .getByRole("button", { name: /Sam Lee Expired sessions cleanup/ })
      .click();
    const conversation = observability.getByRole("region", {
      name: "Conversation detail, with example data",
    });
    await expect(conversation).toContainText("Turn 1");
    await expect(
      conversation.getByRole("heading", { name: "Conversation waterfall" }),
    ).toBeVisible();
    await conversation
      .getByRole("button", { name: "Waterfall", exact: true })
      .click();
    await expect(
      conversation.getByRole("heading", { name: "Conversation waterfall" }),
    ).toBeHidden();
    await conversation.getByRole("button", { name: "Inspect trace →" }).click();
    const detail = observability.locator("[data-detail]:visible");
    await expect(detail).toContainText("tr_8f2c41");
    await detail.getByRole("button", { name: "Tree", exact: true }).click();
    await detail.getByRole("button", { name: /drop_table/ }).click();
    await expect(
      detail.getByRole("region", { name: "Selected span, with example data" }),
    ).toContainText("Nothing was changed");
    await expectNoHorizontalOverflow(page);
    await page.keyboard.press("Escape");
    await expect(
      observability.getByRole("button", {
        name: /Sam Lee Expired sessions cleanup/,
      }),
    ).toBeFocused();
  });
}

test("mobile pills and panels reflow at 320, 390, 768, 1024 and 1440 pixels", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/product/");
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const name of [...desktopNames, ...adminNames]) {
      const frame = page.locator(
        `[data-mock="${desktopNames.includes(name) ? "desktop" : "admin"}"]`,
      );
      const button = frame
        .getByRole("navigation")
        .getByRole("button", { name, exact: name !== "New session" });
      await button.click();
      await expectNoHorizontalOverflow(page);
      if (width > 900) {
        const clipped = await frame.locator(".mock-main").evaluate((main) => {
          const pane = main.querySelector<HTMLElement>(
            "[data-pane]:not([hidden])",
          );
          if (!pane) throw new Error("The active pane must be rendered.");
          return (
            pane.getBoundingClientRect().bottom >
            main.getBoundingClientRect().bottom + 1
          );
        });
        expect(clipped, `${name} at ${width}px must fit the frame`).toBe(false);
      }
      if (width <= 900) {
        expect((await button.boundingBox())?.height).toBeGreaterThanOrEqual(44);
        if (width <= 390)
          expect(
            await frame
              .getByRole("navigation")
              .evaluate((nav) => nav.scrollWidth > nav.clientWidth),
          ).toBe(true);
        expect(
          await frame
            .locator(".mock-window")
            .evaluate((el) => getComputedStyle(el).transform),
        ).toBe("none");
      }
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const admin = page.locator('[data-mock="admin"]');
  await admin.getByRole("button", { name: "Skills", exact: true }).click();
  await admin
    .getByRole("button", { name: /Database cleanup checklist/ })
    .click();
  await expect(admin.locator("[data-detail-list]:visible")).toHaveCount(0);
  await admin.getByRole("button", { name: "← Back to skills" }).click();
  await expect(
    admin.getByRole("button", { name: /Database cleanup checklist/ }),
  ).toBeFocused();
  await admin
    .getByRole("button", { name: "Connected Tools", exact: true })
    .click();
  const opener = admin.getByRole("button", {
    name: "Manage access",
    exact: true,
  });
  await expect(opener).toBeVisible();
  await opener.click();
  const drawer = admin.getByRole("region", {
    name: "Engineering tool access",
    exact: true,
  });
  await expect(drawer).toBeVisible();
  await expect(drawer).toContainText("drop_table");
  await expect(drawer).toContainText("Not granted");
  await expect(admin.locator("[data-connections]:visible")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(opener).toBeFocused();
});

test("the short task sequence finishes once without playback controls or view rotation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.clock.install();
  await page.goto("/product/");
  const frame = page.locator('[data-mock="desktop"]');
  await frame.scrollIntoViewIfNeeded();
  await expect(frame).toHaveCSS("--demo-play-state", "running");
  await page.clock.runFor(5000);
  await expect(frame.locator('[data-at="3000"]')).toBeVisible();
  await expect(frame.locator('[data-at="8600"]')).toHaveCSS(
    "visibility",
    "hidden",
  );
  await page.clock.runFor(5000);
  await expect(frame).toHaveAttribute("data-demo-running", "false");
  await expect(frame.locator('[data-at="8600"]')).toBeVisible();
  await page.getByRole("heading", { level: 1 }).scrollIntoViewIfNeeded();
  await frame.scrollIntoViewIfNeeded();
  await page.clock.runFor(12000);
  await expect(frame).toHaveAttribute("data-demo-running", "false");
  await expect(frame.locator('[data-pane="desktop-app"]')).toBeVisible();
  await frame
    .getByRole("button", { name: "Capabilities", exact: true })
    .click();
  await page.clock.runFor(12000);
  await expect(
    frame.locator('[data-pane="desktop-app-capabilities"]'),
  ).toBeVisible();
});

test("shareable subviews work on both routes and sidebar selection preserves history and scroll", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of ["/", "/product/"]) {
    for (const id of ["capabilities", "traces", "artifacts", "automations"]) {
      await page.goto(`${route}#feature-desktop-app-${id}`);
      await expect(
        page.locator(`[data-pane="desktop-app-${id}"]`),
      ).toBeVisible();
      await expect(page.locator("#desktop-view")).toBeFocused();
    }
    const before = await page.evaluate(() => ({
      history: history.length,
      scroll: scrollY,
    }));
    await page
      .locator('[data-mock="desktop"]')
      .getByRole("button", { name: "Capabilities", exact: true })
      .click();
    await expect(page).toHaveURL(/#feature-desktop-app-capabilities$/u);
    const after = await page.evaluate(() => ({
      history: history.length,
      scroll: scrollY,
    }));
    expect(after).toEqual(before);
    await page.goto(`${route}#unknown-view`);
    await expect(
      page.locator('[data-pane="desktop-app-capabilities"]'),
    ).toBeVisible();
    await page.reload();
    await expect(page.locator('[data-pane="desktop-app"]')).toBeVisible();
    await expect(page.locator('[data-pane="connected-tools"]')).toBeVisible();
  }
});

test("autoplay pauses off screen and any key in the mock ends it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.clock.install();
  await page.goto("/product/");
  const frame = page.locator('[data-mock="desktop"]');
  await frame.scrollIntoViewIfNeeded();
  await expect(frame).toHaveCSS("--demo-play-state", "running");
  await page.clock.runFor(4600);
  await expect(frame.locator('[data-at="4400"]')).toHaveCSS(
    "visibility",
    "visible",
  );
  await page.getByRole("heading", { level: 1 }).scrollIntoViewIfNeeded();
  await expect(frame).toHaveCSS("--demo-play-state", "paused");
  await page.clock.runFor(12000);
  await expect(frame.locator('[data-at="8600"]')).toHaveCSS(
    "visibility",
    "hidden",
  );
  await frame.scrollIntoViewIfNeeded();
  await expect(frame).toHaveCSS("--demo-play-state", "running");
  await page.clock.runFor(6000);
  await expect(frame).toHaveAttribute("data-demo-running", "false");
  await page.reload();
  await frame.scrollIntoViewIfNeeded();
  await expect(frame).toHaveCSS("--demo-play-state", "running");
  await frame
    .getByRole("button", { name: "Capabilities", exact: true })
    .focus();
  await page.keyboard.press("ArrowDown");
  await expect(frame).toHaveAttribute("data-demo-running", "false");
  await expect(frame.locator('[data-at="8600"]')).toHaveCSS(
    "visibility",
    "visible",
  );
});

for (const width of [390, 1440]) {
  test(`Observability filters stay scoped and update dashboard, conversations and trace controls at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/product/#feature-observability");
    const pane = page.locator('[data-pane="observability"]');
    await expect(pane.getByLabel("Filter users")).toBeDisabled();
    const own = pane.locator('[data-scope-panel="own"]');
    await expect(own.locator("[data-observe-stat=count]")).toHaveText("72");
    await expect(
      own.locator("[data-tab-panel=dashboard] [data-observe-stat=sessions]"),
    ).toHaveText("12");
    await expect(own.locator("[data-slowest]:visible")).toHaveCount(5);
    expect(
      await own.locator("[data-chart-line]").first().getAttribute("points"),
    ).toMatch(/(?:\S+\s+){17}\S+/u);
    await pane.getByRole("button", { name: "Deep Dive", exact: true }).click();
    const conversation = pane.getByRole("region", {
      name: "Conversation detail, with example data",
    });
    await expect(conversation.locator(".dash-turn-card:visible")).toHaveCount(
      6,
    );
    await expect(conversation.locator("[data-session-turns]")).toHaveText(
      "6 turns",
    );
    await pane.getByRole("button", { name: "Dashboard", exact: true }).click();
    await pane
      .getByRole("button", { name: "Group: Engineering", exact: true })
      .click();
    await pane.getByLabel("Filter users").selectOption("Sam Lee");
    await expect(
      pane.getByRole("button", { name: "Remove user filter" }),
    ).toContainText("Sam Lee");
    await expect(
      pane.locator("[data-scope-panel]:visible [data-observe-stat=count]"),
    ).toHaveText("72");
    await pane.getByLabel("Observability period").selectOption("1");
    await expect(
      pane.locator("[data-scope-panel]:visible [data-observe-stat=count]"),
    ).toHaveText("9");
    await pane.getByRole("button", { name: "Deep Dive", exact: true }).click();
    await expect(
      pane.getByRole("button", { name: "Sessions", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      pane
        .getByRole("region", { name: "Conversations, with example data" })
        .getByRole("button"),
    ).toHaveCount(3);
    await pane.getByRole("button", { name: "Traces", exact: true }).click();
    await expect(
      pane.getByRole("img", { name: "Trace activity, with example data" }),
    ).toBeVisible();
    await pane.getByRole("button", { name: "Chart", exact: true }).click();
    await expect(
      pane.getByRole("img", { name: "Trace activity, with example data" }),
    ).toBeHidden();
    await pane
      .locator("[data-scope-panel]:visible")
      .getByLabel("Search traces")
      .fill("no matching run");
    await expect(
      pane.getByRole("status").filter({ hasText: "No matching traces" }),
    ).toBeVisible();
    await pane.getByRole("button", { name: "Remove search filter" }).click();
    await pane
      .locator("[data-scope-panel]:visible")
      .getByLabel("Trace status")
      .selectOption("completed");
    await expect(
      pane
        .getByRole("table", { name: "Traces, with example data" })
        .locator("tbody tr:visible"),
    ).toHaveCount(7);
    await pane.getByRole("button", { name: "Remove status filter" }).click();
    await pane
      .locator("[data-scope-panel]:visible")
      .getByLabel("Search traces")
      .fill("sessions_archive table");
    await expect(
      pane
        .getByRole("table", { name: "Traces, with example data" })
        .getByRole("row")
        .filter({ visible: true }),
    ).toHaveCount(2);
    await pane.getByRole("button", { name: "Remove search filter" }).click();
    await pane
      .locator("[data-scope-panel]:visible")
      .getByText("Columns", { exact: true })
      .click();
    await pane.getByRole("checkbox", { name: "Cost", exact: true }).uncheck();
    await expect(
      pane.getByRole("columnheader", { name: "Cost", exact: true }),
    ).toBeHidden();
    await pane
      .locator("[data-scope-panel]:visible")
      .getByText("Columns", { exact: true })
      .click();
    await pane.getByRole("button", { name: "Remove user filter" }).click();
    await pane.getByLabel("Observability period").selectOption("custom");
    await pane.getByLabel("Observability start date").fill("2026-11-20T09:00");
    await expect(
      pane
        .getByRole("status")
        .filter({ hasText: "End date must be after start date" }),
    ).toBeVisible();
    await pane
      .getByRole("button", { name: "Clear filters", exact: true })
      .click();
    await expect(
      pane
        .getByRole("table", { name: "Traces, with example data" })
        .getByRole("row")
        .filter({ visible: true }),
    ).toHaveCount(169);
    await pane.getByLabel("Filter groups").selectOption("Finance");
    await expect(
      pane.getByRole("status").filter({ hasText: "No matching traces" }),
    ).toBeVisible();
    await pane.getByRole("button", { name: "Remove group filter" }).click();
    await pane
      .getByRole("button", { name: "Workspace: Acme", exact: true })
      .click();
    const workspace = pane.locator('[data-scope-panel="workspace"]');
    await expect(
      workspace.locator("[data-observe-stat=summary]").first(),
    ).toHaveText("288 traces · 50 sessions");
    const costs = await workspace
      .locator("tbody [data-column=cost]")
      .allTextContents();
    expect(
      costs.reduce(
        (sum, cost) => sum + Math.round(Number(cost.replace("$", "")) * 100),
        0,
      ),
    ).toBe(2862);
    await pane.getByRole("button", { name: "Sessions", exact: true }).click();
    await expect(
      workspace.locator("[data-session-choice]:visible"),
    ).toHaveCount(50);
    await pane.getByRole("button", { name: "Traces", exact: true }).click();
    await workspace.getByLabel("Trace status").selectOption("error");
    await expect(workspace.locator("tbody tr:visible")).toHaveCount(6);
    await pane.getByRole("button", { name: "Remove status filter" }).click();
    await pane.getByRole("button", { name: "My traces", exact: true }).click();
    await expect(
      pane
        .getByRole("table", { name: "Traces, with example data" })
        .getByRole("row")
        .filter({ visible: true }),
    ).toHaveCount(73);
    await expect(pane).not.toContainText("Organization");
    await expectNoHorizontalOverflow(page);
  });
}
