# W-17 local accessibility regression matrix

This note records the local foundation slice for W-17. It is regression
coverage for the website-owned browser surface; it is not W-17 completion.

## Covered locally

- Production Astro output served through the local Wrangler Pages boundary.
- Current public routes: `/`, `/product/`, `/security/`, `/company/`,
  `/contact/`, `/install/`, `/plans/`, `/how-it-works/`, and `/404`.
- Representative phone, tablet, and desktop viewports.
- User-visible contracts:
  - no horizontal overflow beyond a small browser-rounding tolerance;
  - exactly one visible page-level `h1`;
  - visible and focusable main landmark through the skip link;
  - desktop and mobile navigation expose the expected launch links;
  - mobile navigation disclosure is keyboard-operable and does not trap focus;
  - representative interactive controls retain a visible focus indicator;
  - reduced-motion rendering keeps pages stable; and
  - the browser console has no unexpected errors.
- The production-host contact route is exercised with a stubbed HubSpot native
  loader so the ready state is covered without real external requests,
  personal data, or live form submission.

## Current local evidence

- On July 26, 2026, the Wrangler-backed Playwright matrix passed all 29 checks
  across the routes and viewports listed above.
- A separate Chrome DevTools MCP inspection sampled the home page at
  `1440x1000` and the company page at `390x844`. The accessibility tree exposed
  one page-level `h1`, the first Tab reached the skip link, activating it moved
  focus to `main`, the mobile navigation disclosure opened from the keyboard,
  the mobile document width matched the viewport, and no browser console
  warnings or errors were present.

## Still open

This local matrix does not provide:

- axe automated accessibility evidence;
- real VoiceOver, NVDA, JAWS, or other screen-reader software evidence;
- stable Safari, Firefox, Chrome, or mobile Safari manual evidence;
- Lighthouse, WebPageTest, preview Core Web Vitals, or p75 field evidence;
- Cloudflare preview deployment evidence;
- final W-15 deployed security/CSP evidence; or
- W-16 analytics dashboard arrival and approved privacy/cookie publication
  evidence.

Those remain launch-readiness gaps in the parent website plan and open-gap
register.
