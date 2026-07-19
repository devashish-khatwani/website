# Glaux website

Standalone static marketing website for Glaux.

This repository is intentionally separate from the Glaux application and Control
Tower service. It is static-first and targets Cloudflare Pages with:

- Astro
- TypeScript
- Tailwind CSS through `@tailwindcss/vite`
- Vitest
- Playwright
- ESLint
- Prettier

## Current source documents

Until this website repository has a remote, the parent workspace remains the
source for product requirements and implementation planning:

- [Website PRD](../docs/website/website-prd.md)
- [Website implementation plan](../docs/website/implementation-plan.md)

Before remote publication, replace these relative links with durable repository
URLs or permanent documentation URLs.

## Commands

```sh
npm ci
npm run dev
npm run build
npm run preview
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run test:e2e
```

`npm run build` writes the static Cloudflare Pages output to `dist/`.

## Scope guardrails

W-02 is a toolchain bootstrap only. It does not include analytics, a form
backend, auth logic, production credentials, React islands, upstream Hermes
branding, or public product claims.
