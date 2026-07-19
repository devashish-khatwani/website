import { expect, type Locator, type Page } from "@playwright/test";

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
