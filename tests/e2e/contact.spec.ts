import { expect, test, type Page } from "@playwright/test";
import {
  expectNoHorizontalOverflow,
  expectVisibleFocusOutline,
} from "./assertions";

const canonicalUrl = "https://www.glauxagent.com/contact/";
const hubSpotScriptUrl = "https://js.hsforms.net/forms/embed/v2.js";
const productionContactUrl = "http://www.glauxagent.com:4321/contact/";

declare global {
  interface Window {
    __hubspotCreateArgs?: Array<{
      region?: string;
      portalId?: string;
      formId?: string;
      target?: string;
    }>;
  }
}

function buildHubSpotReadyProviderScript({
  iframeTitle = "",
  includeSubmitButton = true,
}: {
  iframeTitle?: string;
  includeSubmitButton?: boolean;
} = {}) {
  const hostMarkup = [
    `<iframe title="${iframeTitle}" src="about:blank"></iframe>`,
    includeSubmitButton
      ? '<button type="button" data-testid="hubspot-submit">Submit demo request</button>'
      : "",
  ].join("");

  return `
    window.__hubspotCreateArgs = [];
    window.hbspt = {
      forms: {
        create(config) {
          window.__hubspotCreateArgs.push({
            region: config.region,
            portalId: config.portalId,
            formId: config.formId,
            target: config.target
          });
          const host = document.querySelector(config.target);
          if (host) {
            host.insertAdjacentHTML("beforeend", ${JSON.stringify(hostMarkup)});
          }
          window.dispatchEvent(new CustomEvent("hs-form-event:on-ready", {
            detail: { formId: config.formId }
          }));
        }
      }
    };
  `;
}

async function installHubSpotReadyStub(page: Page) {
  await page.route(hubSpotScriptUrl, async (route) => {
    await route.fulfill({
      contentType: "application/javascript",
      body: buildHubSpotReadyProviderScript(),
    });
  });
}

async function dispatchHubSpotEvent(
  page: Page,
  eventName: string,
  formId = "00000000-0000-4000-8000-000000000000",
) {
  await page.evaluate(
    ({ eventName, formId }) => {
      window.dispatchEvent(
        new CustomEvent(eventName, {
          detail: { formId },
        }),
      );
    },
    { eventName, formId },
  );
}

async function expectDemoFormReady(page: Page) {
  await expect(page.locator("#hubspot-demo-form-host iframe")).toHaveAttribute(
    "title",
    "Glaux demo request form",
  );
  await expect(page.locator("#contact-form-status")).toBeHidden();
  await expect(page.locator("#contact-form-status")).toHaveText("");
}

test("contact page renders noindexed HubSpot shell without local form fields", async ({
  page,
}) => {
  await page.goto("/contact/");

  await expect(page).toHaveTitle(/Book a demo \| Glaux/u);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    canonicalUrl,
  );
  await expect(
    page.getByRole("heading", {
      name: "Tell us what your team wants AI to help with.",
    }),
  ).toBeVisible();
  await expect(page.getByText("A focused conversation.")).toBeVisible();
  await expect(page.locator(".product-lede")).toContainText(
    "Share a little about your team, the work you want to improve",
  );
  await expect(page.locator(".contact-note")).toContainText(
    "We’ll learn about your goals, current workflows, and requirements",
  );
  await expect(page.locator(".contact-page")).not.toContainText(
    /available on production|production build|preview, local|unknown hosts|production hostname|release switch|request status|demo request form is ready/u,
  );

  await expect(page.locator("form")).toHaveCount(0);
  await expect(page.locator(".contact-form.surface")).toHaveCount(1);
  await expect(page.locator("#contact-form-status")).toHaveAttribute(
    "role",
    "status",
  );
  await expect(page.locator("#contact-form-status")).toHaveAttribute(
    "aria-live",
    "polite",
  );
  await expect(
    page.locator("#contact-form-status + #hubspot-demo-form-host"),
  ).toHaveCount(1);
  await expect(page.getByLabel(/Work email/u)).toHaveCount(0);
  await expect(page.locator(`script[src="${hubSpotScriptUrl}"]`)).toHaveCount(
    0,
  );
  await expect(page.getByRole("status")).toContainText(
    "Demo requests are temporarily unavailable",
  );
});

test("production hostname loads the native HubSpot embed and reaches ready state", async ({
  page,
}) => {
  await installHubSpotReadyStub(page);

  await page.goto(productionContactUrl);

  await expect(page.locator(`script[src="${hubSpotScriptUrl}"]`)).toHaveCount(
    1,
  );
  await expectDemoFormReady(page);
  await expect(
    page.locator("#hubspot-demo-form-host .hubspot-form-skeleton"),
  ).toHaveCount(0);
  await expect(page.locator("#hubspot-demo-form-host iframe")).toHaveAttribute(
    "title",
    "Glaux demo request form",
  );
  await expect
    .poll(() => page.evaluate(() => window.__hubspotCreateArgs ?? []))
    .toEqual([
      {
        region: "na2",
        portalId: "123456",
        formId: "00000000-0000-4000-8000-000000000000",
        target: "#hubspot-demo-form-host",
      },
    ]);
});

test("preview and local hostnames do not load HubSpot even when build config is enabled", async ({
  page,
}) => {
  const scriptRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url() === hubSpotScriptUrl) {
      scriptRequests.push(request.url());
    }
  });

  await page.goto("/contact/");
  await page.waitForLoadState("networkidle");

  await expect(page.locator(`script[src="${hubSpotScriptUrl}"]`)).toHaveCount(
    0,
  );
  await expect(page.getByRole("status")).toContainText(
    "Demo requests are temporarily unavailable",
  );
  expect(scriptRequests).toEqual([]);
});

test("HubSpot load failure exposes one retry control and retry does not duplicate embed state", async ({
  page,
}) => {
  let scriptAttempts = 0;
  await page.route(hubSpotScriptUrl, async (route) => {
    scriptAttempts += 1;
    if (scriptAttempts === 1) {
      await route.abort("blockedbyclient");
      return;
    }

    await route.fulfill({
      contentType: "application/javascript",
      body: buildHubSpotReadyProviderScript({
        iframeTitle: "Glaux demo request form",
        includeSubmitButton: false,
      }),
    });
  });

  await page.goto(productionContactUrl);

  await expect(page.getByRole("status")).toContainText(
    "We couldn’t load the demo request form",
  );
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();

  await page.getByRole("button", { name: "Try again" }).click();

  await expectDemoFormReady(page);
  await expect(page.locator(`script[src="${hubSpotScriptUrl}"]`)).toHaveCount(
    1,
  );
  await expect(page.locator("#hubspot-demo-form-host iframe")).toHaveCount(1);
  await expect
    .poll(() => page.evaluate(() => window.__hubspotCreateArgs?.length ?? 0))
    .toBe(1);
});

test("HubSpot success and failure events update safe inline status without redirect", async ({
  page,
}) => {
  await installHubSpotReadyStub(page);
  await page.goto(productionContactUrl);
  await expectDemoFormReady(page);

  const initialUrl = page.url();
  await page.locator("[data-testid='hubspot-submit']").focus();
  await page.locator("[data-testid='hubspot-submit']").evaluate((element) => {
    element.remove();
  });
  await dispatchHubSpotEvent(page, "hs-form-event:on-submission:success");

  await expect(page.getByRole("status")).toContainText(
    "Your demo request was received",
  );
  await expect(page.getByRole("status")).not.toContainText("two business days");
  await expect(page.locator("#contact-form-status")).toBeFocused();
  expect(page.url()).toBe(initialUrl);

  await dispatchHubSpotEvent(page, "hs-form-event:on-submission:failed");
  await expect(page.getByRole("status")).toContainText(
    "Your demo request was received",
  );
});

test("HubSpot submission failure shows safe inline recovery copy while ready", async ({
  page,
}) => {
  await installHubSpotReadyStub(page);
  await page.goto(productionContactUrl);
  await expectDemoFormReady(page);

  const initialUrl = page.url();
  await page.locator("[data-testid='hubspot-submit']").focus();
  await page.locator("[data-testid='hubspot-submit']").evaluate((element) => {
    element.remove();
  });
  await dispatchHubSpotEvent(page, "hs-form-event:on-submission:failed");

  await expect(page.getByRole("status")).toContainText(
    "We couldn’t send your request",
  );
  await expect(page.locator("#contact-form-status")).toBeFocused();
  expect(page.url()).toBe(initialUrl);

  await dispatchHubSpotEvent(page, "hs-form-event:on-submission:success");
  await expect(page.getByRole("status")).toContainText(
    "Your demo request was received",
  );

  await dispatchHubSpotEvent(page, "hs-form-event:on-submission:failed");
  await expect(page.getByRole("status")).toContainText(
    "Your demo request was received",
  );

  await expect(
    page.getByText(
      /js\.hsforms|portal|formId|00000000|123456|operator@example|stack trace|internal URL/u,
    ),
  ).toHaveCount(0);
});

test("stale HubSpot ready events do not recover a blocked script state", async ({
  page,
}) => {
  await page.route(hubSpotScriptUrl, async (route) => {
    await route.abort("blockedbyclient");
  });

  await page.goto(productionContactUrl);
  await expect(page.getByRole("status")).toContainText(
    "We couldn’t load the demo request form",
  );

  await dispatchHubSpotEvent(page, "hs-form-event:on-ready");

  await expect(page.getByRole("status")).toContainText(
    "We couldn’t load the demo request form",
  );
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(page.locator("#hubspot-demo-form-host iframe")).toHaveCount(0);
});

test("events for other HubSpot forms are ignored", async ({ page }) => {
  await installHubSpotReadyStub(page);
  await page.goto(productionContactUrl);
  await expectDemoFormReady(page);

  await dispatchHubSpotEvent(
    page,
    "hs-form-event:on-submission:success",
    "11111111-1111-4111-8111-111111111111",
  );
  await expectDemoFormReady(page);
});

test("HubSpot remains contact-only and no launch analytics trackers run", async ({
  page,
}) => {
  const observedTrackedRequests: string[] = [];
  const trackerPattern =
    /hubspot|hsforms|hs-scripts|hs-analytics|googletagmanager|google-analytics|plausible|segment|mixpanel|clarity|fullstory/u;

  page.on("request", (request) => {
    if (trackerPattern.test(request.url())) {
      observedTrackedRequests.push(request.url());
    }
  });

  await page.goto("/product/");
  await page.waitForLoadState("networkidle");
  expect(observedTrackedRequests).toEqual([]);

  await installHubSpotReadyStub(page);
  await page.goto(productionContactUrl);
  await expectDemoFormReady(page);

  expect(observedTrackedRequests).toEqual([hubSpotScriptUrl]);
  const cookies = await page.context().cookies();
  expect(
    cookies.filter((cookie) =>
      /hubspot|hubspotutk|__hstc|__hssc|__hssrc|_ga|_gid/u.test(cookie.name),
    ),
  ).toEqual([]);
});

test("contact build exposes no private HubSpot credentials or provider internals", async ({
  page,
}) => {
  await installHubSpotReadyStub(page);
  await page.goto(productionContactUrl);
  await expectDemoFormReady(page);

  await expect(page.locator("body")).not.toContainText(
    /PRIVATE_HUBSPOT|HUBSPOT_ACCESS_TOKEN|HUBSPOT_API_KEY|client_secret|authorization|bearer|__SECRET_INTERNAL_DO_NOT_USE/u,
  );
  expect(await page.content()).not.toMatch(
    /PRIVATE_HUBSPOT|HUBSPOT_ACCESS_TOKEN|HUBSPOT_API_KEY|client_secret|authorization|bearer|__SECRET_INTERNAL_DO_NOT_USE/u,
  );
});

test("contact embed keyboard focus remains visible and mobile/desktop layouts do not overflow", async ({
  page,
}) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/contact/");
    await expectNoHorizontalOverflow(page);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/contact/");
  const productLink = page.getByRole("link", { name: "Explore the product" });
  await productLink.focus();
  await expectVisibleFocusOutline(productLink);
});

test("contact stays out of the sitemap while W-13 blockers remain", async ({
  page,
}) => {
  await page.goto("/sitemap.xml");
  await expect(page.locator("body")).not.toContainText("/contact/");
});
