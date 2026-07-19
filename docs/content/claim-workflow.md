# Content and claim workflow

Website pages are version-controlled Markdown or MDX entries under
`src/content/pages/`. Claim registry entries live under `src/content/claims/`.

Run the release validator before treating content as publishable:

```sh
npm run validate:content
```

`npm run build` runs the same release validation before `astro build`, so
publishability and claim cross-reference failures block production builds.

## Evidence classes

- `verified-implementation` — tested source or current implementation evidence.
- `verified-architecture` — current architecture or deployment evidence.
- `planned` — explicitly planned future support.
- `preview` — preview capability that must be labeled at the point of use.
- `coming-soon` — not available yet; must not read as shipped.
- `external-alignment` — alignment with an external framework; never certification.

## Publication workflow

Claims move through `draft`, `approved`, or `retired`. A launch or public page
must have `claimReviewStatus: "approved"` and can only reference approved claims
with approved review metadata.

An approved claim must include its evidence class, at least one evidence item,
an owner, approved review status, reviewer, and review date. Draft and blocked
claims may omit this approval metadata until they are ready for review.

Blocked claims are allowed only as non-public drafts. The observability claim is
seeded this way because W-01 has not assigned its launch availability label.

Do not add owner names, reviewer names, dates, customer proof, certification
claims, or production-security claims unless the evidence exists in the repo and
the owner has approved publication.
