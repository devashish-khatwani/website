import { expect, type Locator, type Page } from "@playwright/test";

export async function expectNoPlansInNavigation(page: Page) {
  const chrome = page.locator("header, nav, footer");
  for (const text of await chrome.allTextContents())
    expect(text).not.toMatch(/\bPlans\b/iu);
  const links = await chrome
    .locator("a[href]")
    .evaluateAll((anchors) => anchors.map((a) => a.getAttribute("href") ?? ""));
  for (const href of links) {
    const url = new URL(href, page.url());
    expect(url.pathname).not.toMatch(/^\/plans\/?$/iu);
    expect(url.hash).not.toMatch(/^#plans$/iu);
  }
}

export async function expectMockCurrencyTotals(page: Page) {
  const cents = (text: string) => Number(text.replace(/[$,.]/gu, ""));
  const sum = async (locator: Locator) =>
    (await locator.allTextContents()).reduce(
      (total, text) => total + cents(text),
      0,
    );
  for (const scope of await page.locator("[data-scope-panel]").all()) {
    const total = cents(
      await scope.locator('[data-observe-stat="cost"]').first().innerText(),
    );
    expect(await sum(scope.locator("[data-model-cost]"))).toBe(total);
    expect(
      await sum(
        scope.locator(
          'tr[data-observe-record]:not([hidden]) [data-column="cost"]',
        ),
      ),
    ).toBe(total);
    expect(await sum(scope.locator("[data-session-cost]"))).toBe(total);
  }
  for (const gateway of await page.locator("[data-usage]").all()) {
    const total = cents(
      await gateway.locator('[data-usage-kpi="spend"]').innerText(),
    );
    expect(
      await sum(
        gateway.locator('[data-usage-row]:not([hidden]) [data-value="spend"]'),
      ),
    ).toBe(total);
  }
  for (const mock of await page.locator("[data-mock]").all()) {
    const amounts = await mock.evaluate((element) => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const amounts: string[] = [];
      while (walker.nextNode())
        amounts.push(
          ...(walker.currentNode.textContent?.match(/\$\d[\d,]*(?:\.\d+)?/gu) ??
            []),
        );
      return amounts;
    });
    expect(
      amounts.filter(
        (amount) => amount !== "$2,000" && !/^\$[\d,]+\.\d{2}$/u.test(amount),
      ),
    ).toEqual([]);
  }
}

export async function expectNoHorizontalOverflow(page: Page) {
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );

  expect(hasHorizontalOverflow).toBe(false);
}

export async function expectVisibleFocusOutline(locator: Locator) {
  await expect(locator).toBeFocused();

  const outline = await locator.evaluate((element) => {
    const styles = window.getComputedStyle(element);

    return {
      color: styles.outlineColor,
      style: styles.outlineStyle,
      width: styles.outlineWidth,
    };
  });

  expect(outline.style).not.toBe("none");
  expect(Number.parseFloat(outline.width)).toBeGreaterThan(0);
  expect(outline.color).not.toBe("rgba(0, 0, 0, 0)");
}
