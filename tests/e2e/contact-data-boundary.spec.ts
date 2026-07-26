import { expect, test } from "@playwright/test";

const hubSpotScriptUrl = "https://js.hsforms.net/forms/embed/v2.js";
const productionContactUrl = `http://www.glauxagent.com:${
  process.env.GLAUX_PAGES_PORT ?? "8788"
}/contact/?email=sentinel%2Bcontact%40example.test&company=SentinelSensitiveCo&contactId=contact-123&accountId=acct-456&providerError=sk-provider-secret`;

const forbiddenPatterns = [
  /sentinel\+contact@example\.test/u,
  /sentinel%2bcontact%40example\.test/iu,
  /SentinelSensitiveCo/u,
  /contact-123/u,
  /acct-456/u,
  /sk-provider-secret/u,
] as const;

test("contact runtime does not persist or retransmit contact/query sentinels outside the authorized embed", async ({
  page,
}) => {
  const consoleMessages: string[] = [];
  const observedRequests: Array<{
    headers: Record<string, string>;
    method: string;
    postData: string;
    url: string;
  }> = [];

  page.on("console", (message) => {
    consoleMessages.push(message.text());
  });
  page.on("request", (request) => {
    observedRequests.push({
      headers: request.headers(),
      method: request.method(),
      postData: request.postData() ?? "",
      url: request.url(),
    });
  });

  await page.route(hubSpotScriptUrl, async (route) => {
    await route.fulfill({
      contentType: "text/javascript",
      body: `
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
              const iframe = document.createElement("iframe");
              iframe.title = "Glaux demo request form";
              document.querySelector(config.target).append(iframe);
              window.dispatchEvent(new CustomEvent("hs-form-event:on-ready", {
                detail: { formId: config.formId }
              }));
            }
          }
        };
      `,
    });
  });

  await page.goto(productionContactUrl);
  await expect(page.locator('meta[name="referrer"]')).toHaveAttribute(
    "content",
    "no-referrer",
  );
  await expect(page.locator("#hubspot-demo-form-host iframe")).toHaveAttribute(
    "title",
    "Glaux demo request form",
  );

  const pageContent = await page.content();
  const storageSnapshot = await page.evaluate(async () => {
    const indexedDatabaseNames =
      "databases" in indexedDB
        ? await indexedDB
            .databases()
            .then((databases) =>
              databases.map((database) => database.name ?? ""),
            )
        : [];
    const cacheKeys = "caches" in window ? await caches.keys() : [];
    const serviceWorkerRegistrations = navigator.serviceWorker
      ? await navigator.serviceWorker
          .getRegistrations()
          .then((registrations) =>
            registrations.map((registration) => registration.scope),
          )
      : [];
    return {
      localStorage: { ...localStorage },
      sessionStorage: { ...sessionStorage },
      indexedDatabaseNames,
      cacheKeys,
      serviceWorkerRegistrations,
      serviceWorkerController:
        navigator.serviceWorker?.controller?.scriptURL ?? "",
    };
  });
  const cookies = await page.context().cookies();
  const createArgs = await page.evaluate(() => window.__hubspotCreateArgs);

  expect(createArgs).toEqual([
    {
      region: "na2",
      portalId: "123456",
      formId: "00000000-0000-4000-8000-000000000000",
      target: "#hubspot-demo-form-host",
    },
  ]);
  expect(
    observedRequests
      .map((request) => request.url)
      .filter((url) => url === hubSpotScriptUrl),
  ).toEqual([hubSpotScriptUrl]);

  const followOnRequests = observedRequests.filter(
    (request) => request.url !== productionContactUrl,
  );
  for (const request of followOnRequests) {
    expect(request.headers.referer).toBeUndefined();
  }
  const inspectedRuntimeSurface = JSON.stringify({
    pageContent,
    consoleMessages,
    followOnRequests,
    storageSnapshot,
    cookies,
  });

  for (const forbiddenPattern of forbiddenPatterns) {
    expect(inspectedRuntimeSurface).not.toMatch(forbiddenPattern);
  }
  expect(cookies).toEqual([]);
});
