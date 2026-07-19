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

The private parent Glaux repository remains the source of truth for product
requirements and implementation planning. These links are intentionally
repository-scoped and require access to the Glaux repository:

- [Website PRD](https://github.com/devashish-khatwani/Glaux/blob/main/docs/website/website-prd.md)
- [Website implementation plan](https://github.com/devashish-khatwani/Glaux/blob/main/docs/website/implementation-plan.md)

## Commands

```sh
npm ci
npm run dev
npm run build
npm run preview
npm run validate:content
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run test:e2e
```

`npm run build` writes the static Cloudflare Pages output to `dist/`.

Content authors should run `npm run validate:content` before requesting release
review. The claim workflow and evidence classes are documented in
[`docs/content/claim-workflow.md`](docs/content/claim-workflow.md).

## Scope guardrails

The current route remains a placeholder. It does not include analytics, a form
backend, auth logic, production credentials, React islands, upstream Hermes
branding, or public product claims.
