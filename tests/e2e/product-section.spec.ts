import { expect, test } from "@playwright/test";
import {
  expectNoHorizontalOverflow,
  expectVisibleFocusOutline,
} from "./assertions";

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
  "Observability",
  "Audit",
];

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
  await expect(frame.locator("[data-scope-panel]:visible")).toContainText(
    "Audit export for Q4",
  );
  await expect(
    frame.locator("[data-scope-panel]:visible [data-open]"),
  ).toHaveCount(1);
  await frame
    .getByRole("button", { name: "Group: Engineering", exact: true })
    .click();
  await expect(
    frame.locator("[data-scope-panel]:visible [data-open]"),
  ).toHaveCount(4);
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
    frame.locator("[data-scope-panel]:visible [data-open]"),
  ).toHaveCount(7);
  await frame.getByRole("button", { name: "Audit", exact: true }).click();
  const grant = frame.locator("details").filter({ hasText: "evt_31d9a07c" });
  await expect(grant).toHaveAttribute("open", "");
  await expect(grant).toContainText("Engineering: no access → list_tables");
  await grant.locator("summary").click();
  await expect(grant).not.toHaveAttribute("open", "");
});

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
