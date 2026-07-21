import { expect, test } from "@playwright/test";
import {
  expectNoHorizontalOverflow,
  expectVisibleFocusOutline,
} from "./assertions";

const canonicalUrl = "https://www.glauxagent.com/plans/";

test("plans page renders pricing, metadata, and usage separation", async ({
  page,
}) => {
  await page.goto("/plans/");

  await expect(page).toHaveTitle(/Plans \| Glaux/u);
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
      name: "Start focused. Scale with control.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "LLM usage is metered and billed separately at provider cost.",
      { exact: false },
    ),
  ).toBeVisible();

  for (const [name, price] of [
    ["Core", "$0"],
    ["Team", "$20"],
    ["Business", "$100"],
    ["Enterprise", "$200"],
  ] as const) {
    const plan = page.locator("article").filter({
      has: page.getByRole("heading", { name, exact: true }),
    });

    await expect(plan.getByText(price, { exact: true })).toBeVisible();
    await expect(
      plan.getByText("platform fee / month", { exact: true }),
    ).toBeVisible();
  }

  await expect(page.getByText("Recommended", { exact: true })).toBeVisible();
  await expect(page.getByText(/placeholder checkout links/u)).toHaveCount(0);
  await expect(page.getByText(/Proposed plans page/u)).toHaveCount(0);
});

test("plans page routes sign-in and all plan actions to live destinations", async ({
  page,
}) => {
  await page.goto("/plans/");

  await expect(
    page.getByRole("main").getByRole("link", { name: "Sign in" }),
  ).toHaveAttribute("href", "https://app.glauxagent.com/login");

  for (const action of [
    "Choose Core",
    "Choose Team",
    "Choose Business",
    "Contact sales",
    "Talk to us",
  ]) {
    await expect(
      page.getByRole("main").getByRole("link", { name: action }),
    ).toHaveAttribute("href", "/contact/");
  }

  await expect(page.locator('a[href*="checkout"]')).toHaveCount(0);
  await expect(page.getByRole("main").locator('a[href^="#"]')).toHaveCount(0);
});

test("plans page preserves plan feature vectors and expected features", async ({
  page,
}) => {
  await page.goto("/plans/");

  for (const [name, source, alt, feature] of [
    [
      "Core",
      "/plans/plan-core.svg",
      "A structured personal workspace with one active agent workflow",
      "Personal memory and skills",
    ],
    [
      "Team",
      "/plans/plan-team.svg",
      "Connected workstreams sharing one governed team workspace",
      "Approval requests",
    ],
    [
      "Business",
      "/plans/plan-business.svg",
      "A central policy control plane governing connected workspaces",
      "Central Control Tower",
    ],
    [
      "Enterprise",
      "/plans/plan-enterprise.svg",
      "Layered identity, policy, and deployment boundaries",
      "Identity and access integration",
    ],
  ] as const) {
    const plan = page.locator("article").filter({
      has: page.getByRole("heading", { name, exact: true }),
    });
    const vector = plan.getByRole("img", { name: alt });

    await expect(vector).toBeVisible();
    await expect(vector).toHaveAttribute("src", source);
    await expect(plan.getByText(feature, { exact: true })).toBeVisible();
  }
});

test("plans page keeps visible focus on route-specific actions", async ({
  page,
}) => {
  await page.goto("/plans/");

  const teamAction = page.getByRole("main").getByRole("link", {
    name: "Choose Team",
  });
  await teamAction.focus();
  await expectVisibleFocusOutline(teamAction);

  const signIn = page.getByRole("main").getByRole("link", {
    name: "Sign in",
  });
  await signIn.focus();
  await expectVisibleFocusOutline(signIn);
});

test("plans page has no horizontal overflow on mobile, tablet, or desktop", async ({
  page,
}) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/plans/");
    await expectNoHorizontalOverflow(page);
  }
});
