# Contact data boundary

W-11 uses HubSpot's native externally embedded form as the only launch contact
submission processor. Website-owned code may load the operational HubSpot form
script on `www.glauxagent.com`, but it must not collect, proxy, log, persist,
or retransmit contact-form payloads itself.

## Website-owned boundary

- The public site does not define a custom contact submission endpoint,
  Cloudflare Pages Function, HubSpot Forms API client, or site-wide HubSpot
  tracking loader.
- The contact page may pass public HubSpot `region`, `portalId`, and `formId`
  values to `hbspt.forms.create`. These are public embed identifiers, not
  private credentials.
- Contact payloads, contact identifiers, provider error bodies, private
  credentials, sensitive raw query strings, and HubSpot account secrets must
  not be written by website-owned code to the DOM, console, browser storage,
  browser-readable cookies, service workers, CacheStorage, IndexedDB, first-party
  request bodies, first-party request URLs after the initial navigation, or
  analytics/beacon APIs.
- Safe inline lifecycle states may say the form is loading, unavailable, failed,
  received, or ready. They must not include raw provider errors, environment
  variables, internal URLs, payload fields, contact IDs, or private credentials.

## Evidence scope

The unit test `tests/unit/contact-data-boundary.test.ts` scans the website-owned
contact source for logging, storage, beacon, custom processor, and Forms API
sinks. The Playwright test `tests/e2e/contact-data-boundary.spec.ts` exercises
the production bundle through the existing Wrangler boundary with a stubbed
HubSpot loader and sentinel contact/query values.

This evidence is intentionally limited to the website-owned source/build/runtime
boundary. It does not prove HubSpot account logs, Cloudflare platform logs,
production CSP, trusted-domain configuration, notification delivery, actual
submission processing, retention/deletion rules, DPA coverage, or final
privacy/legal approval. Those remain W-11/W-13 open gaps.
