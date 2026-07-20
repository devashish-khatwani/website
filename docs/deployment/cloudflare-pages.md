# Cloudflare Pages deployment runbook

This website is designed for Cloudflare Pages Git integration. GitHub Actions
checks the repository; it does not deploy it. Do not add Wrangler deployment
tokens or a Direct Upload workflow.

## Project configuration

An authorized operator must create and connect the project in the Cloudflare
dashboard:

1. Open **Workers & Pages**, choose **Create application** > **Pages** >
   **Connect to Git**, and select GitHub.
2. Install or configure the **Cloudflare Workers and Pages** GitHub App with
   **Only select repositories** access, limited to this website repository.
3. Select the repository and configure:

   | Setting                | Value           |
   | ---------------------- | --------------- |
   | Framework preset       | Astro           |
   | Build command          | `npm run build` |
   | Build output directory | `dist`          |
   | Root directory         | `/`             |
   | Production branch      | `main`          |

4. Under branch controls, enable automatic production deployments for `main`
   and select **All non-Production branches** for previews. This creates previews
   for branches and pull requests originating in the same repository. Cloudflare
   does not create preview URLs for pull requests from forks.
5. Use the repository's `.nvmrc` as the Node.js version pin. Do not add a
   duplicate `NODE_VERSION` setting unless a future build constraint requires it.
6. Set `PUBLIC_SITE_ORIGIN` in production to the canonical public website origin
   `https://www.glauxagent.com`. The value must be an origin only, with no path,
   query string, or fragment, and must use HTTPS. Preview deployments may leave
   the default in place because `robots.txt` allows crawling only when
   Cloudflare Pages explicitly identifies the build as the `main` branch.
7. Add `PUBLIC_APP_ORIGIN` separately to the preview and production
   environments when W-05 or W-12 begins consuming it. It is a non-secret,
   absolute HTTPS origin for the Glaux app; it must not include an invented
   post-login path.
8. Keep the HubSpot demo form kill switch disabled until W-13 approval and
   account setup are complete. Production may enable the native embed only with
   these public, non-secret variables:

   | Variable                           | Value before W-13            |
   | ---------------------------------- | ---------------------------- |
   | `PUBLIC_HUBSPOT_DEMO_FORM_ENABLED` | `false`                      |
   | `PUBLIC_HUBSPOT_PORTAL_ID`         | unset                        |
   | `PUBLIC_HUBSPOT_DEMO_FORM_ID`      | unset                        |
   | `PUBLIC_HUBSPOT_REGION`            | unset; later copy from embed |

   Do not set real IDs in Git. Do not add a private token, custom Cloudflare
   form processor, Forms REST API integration, or site-wide HubSpot tracking.
   The website runtime also requires the exact hostname `www.glauxagent.com`;
   preview, local, CI, branch, and unknown hosts do not load the HubSpot script
   even if these public variables leak into a build.

Cloudflare injects these build variables automatically; do not add their values
or any secrets to the repository:

| Variable              | Purpose                                        |
| --------------------- | ---------------------------------------------- |
| `CI`                  | Identifies a CI build environment.             |
| `CF_PAGES`            | Identifies that the build is running on Pages. |
| `CF_PAGES_COMMIT_SHA` | Identifies the commit being deployed.          |
| `CF_PAGES_BRANCH`     | Identifies the deployment branch.              |
| `CF_PAGES_URL`        | Provides the URL assigned to the deployment.   |

## Access and release controls

- Protect previews with Cloudflare Access before sharing them when unpublished
  content or product claims may be present.
- Before enabling production deployment, review who can merge to `main`, who
  can administer the Pages project and custom domain, and whether the GitHub App
  remains limited to this repository. Require only the permissions needed for
  those responsibilities.
- Keep deployment credentials out of GitHub Actions. Pages receives source via
  its GitHub App connection.

## Verification and rollback

After connecting the project, verify a preview before the first production
release:

- Open a branch or same-repository pull request and confirm that CI passes and a
  Pages preview deployment is created.
- Inspect the preview's deployment branch and commit SHA, then exercise its
  navigation, responsive layout, links, and expected no-index response.
- Confirm that a fork pull request does not receive a Pages preview.
- Merge an approved change to `main`; confirm the production deployment uses
  the expected commit, build command, output directory, and public origin.
- Review production access and custom-domain/DNS permissions before publishing
  or changing the domain.
- For `/contact/`, verify the production deployment is on
  `www.glauxagent.com` before enabling `PUBLIC_HUBSPOT_DEMO_FORM_ENABLED=true`.
  If the embed must be rolled back, set
  `PUBLIC_HUBSPOT_DEMO_FORM_ENABLED=false`, redeploy, and confirm the page shows
  the unavailable state without requesting `https://js.hsforms.net/forms/embed/v2.js`.
- Contact-specific CSP/header enforcement is not complete until W-15 adds the
  Cloudflare route header policy for the native HubSpot form. Keep the policy
  scoped to `/contact/` where possible and do not allow HubSpot site-wide
  tracking sources.
- Practice rollback from **Deployments** by selecting a previously verified
  production deployment and choosing **Rollback to this deployment**. Recheck
  the deployed commit and critical pages after rollback.

Repository configuration alone cannot prove these checks. Until an operator
creates and connects the Pages project, GitHub App scope, branch controls,
environment values, previews, production deployment, Access policy, custom
domain, HubSpot account controls, and rollback remain external W-14 verification
gaps.

## HubSpot account checklist

The account owner published the HubSpot form on 2026-07-20 and verified the
public embed metadata outside Git. The published form has:

- Form name `Glaux — Book a demo`.
- Required fields: work email, name, company, role.
- Optional fields: deployment stage, expected users, message.
- A required processing-only consent checkbox with this text:
  `I agree that Glaux may store and process this information to respond to my demo request.`
- Contacts created as non-marketing by default.
- CAPTCHA enabled.
- Pre-population and form shortening disabled.
- An inline success message with no redirect.

HubSpot's native data-privacy block could not express processing-only consent
without also adding communications consent in this account, so the published
form uses a required custom single-checkbox property. Legal review must accept
that implementation before production publication.

These controls remain external release gaps and must be recorded by their
owners before the production kill switch is enabled:

- Restrict the trusted domain to `www.glauxagent.com` and verify the production
  embed from that host.
- Route notifications to a `Demo Requests` team and a backup administrator.
- Confirm the two-business-day response process.
- Configure and evidence the 365-day inactivity-deletion process.
- Provision and monitor `privacy@glauxagent.com`.
- Make the standard DPA available.
- Schedule the rate-risk review for 30 days after launch.
- Complete a real production smoke submission and verify safe failure behavior.

## Cloudflare references

- [Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/)
- [GitHub integration and repository access](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/)
- [Preview deployments](https://developers.cloudflare.com/pages/configuration/preview-deployments/)
- [Branch deployment controls](https://developers.cloudflare.com/pages/configuration/branch-build-controls/)
- [Build configuration and injected variables](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Build image and runtime version pins](https://developers.cloudflare.com/pages/configuration/build-image/)
- [Rollbacks](https://developers.cloudflare.com/pages/configuration/rollbacks/)
