import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { assertRequiredContentDirectory } from "../../scripts/validate-content";
import { validateContentForRelease } from "../../src/lib/content/validate";

const approvedLaunchPage = {
  title: "Security",
  description: "Plain-language controls and evidence for the Glaux website.",
  canonicalPath: "/security/",
  og: {
    title: "Security",
    description: "Plain-language controls and evidence for the Glaux website.",
    imageAlt: "Monochrome Glaux security page social preview.",
  },
  launchState: "launch",
  publicationState: "public",
  claimReviewStatus: "approved",
  claimReferences: ["claim-approved"],
};

const approvedClaim = {
  id: "claim-approved",
  title: "Approved claim",
  statement: "Glaux is a separately deployable control plane.",
  classification: "verified-architecture",
  publicationState: "approved",
  owner: "Content owner",
  evidence: [{ label: "Architecture note", source: "Current PRD" }],
  review: {
    status: "approved",
    reviewer: "Content reviewer",
    reviewedAt: "2026-07-19",
  },
};

describe("content release validation", () => {
  it("rejects claim registry entries with an unknown evidence class", () => {
    const result = validateContentForRelease({
      claims: [{ ...approvedClaim, classification: "certified-secure" }],
      pages: [],
    });

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.message).join(" ")).toMatch(
      /Invalid option/u,
    );
  });

  it("rejects non-blocked claim registry entries without an evidence class", () => {
    const result = validateContentForRelease({
      claims: [
        {
          id: "claim-approved",
          title: "Approved claim",
          statement: "Glaux is a separately deployable control plane.",
          publicationState: "draft",
          evidence: [{ label: "Architecture note", source: "Current PRD" }],
          review: { status: "approved" },
        },
      ],
      pages: [],
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual({
      scope: "claim",
      id: "claim-approved",
      message: "Non-blocked claims require a classification.",
    });
  });

  it("rejects approved claims without required evidence and review metadata", () => {
    const result = validateContentForRelease({
      claims: [
        {
          id: "claim-approved",
          title: "Approved claim",
          statement: "Glaux is a separately deployable control plane.",
          classification: "verified-architecture",
          publicationState: "approved",
          evidence: [],
          review: { status: "draft" },
        },
      ],
      pages: [],
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        {
          scope: "claim",
          id: "claim-approved",
          message: "Approved claims require at least one evidence item.",
        },
        {
          scope: "claim",
          id: "claim-approved",
          message: "Approved claims require an owner.",
        },
        {
          scope: "claim",
          id: "claim-approved",
          message: "Approved claims require approved review status.",
        },
        {
          scope: "claim",
          id: "claim-approved",
          message: "Approved claims require a reviewer.",
        },
        {
          scope: "claim",
          id: "claim-approved",
          message: "Approved claims require a review date.",
        },
      ]),
    );
  });

  it("rejects launch pages that omit claim references", () => {
    const result = validateContentForRelease({
      claims: [approvedClaim],
      pages: [{ ...approvedLaunchPage, claimReferences: [] }],
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual({
      scope: "release",
      id: "/security/",
      message: "Launch or public pages require at least one claim reference.",
    });
  });

  it("rejects launch pages that reference a missing claim", () => {
    const result = validateContentForRelease({
      claims: [],
      pages: [approvedLaunchPage],
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual({
      scope: "release",
      id: "/security/",
      message: "Missing claim reference: claim-approved.",
    });
  });

  it("rejects launch pages without approved claim review", () => {
    const result = validateContentForRelease({
      claims: [approvedClaim],
      pages: [{ ...approvedLaunchPage, claimReviewStatus: "draft" }],
    });

    expect(result.valid).toBe(false);
    expect(
      result.issues.some((issue) =>
        /approved claim review/u.test(issue.message),
      ),
    ).toBe(true);
  });

  it("rejects a blocked observability claim when a launch page tries to publish it", () => {
    const result = validateContentForRelease({
      claims: [
        {
          id: "claim-observability-blocked",
          title: "Observability availability pending",
          statement: "Understand every governed run.",
          publicationState: "draft",
          blocked: {
            reason:
              "The W-01 availability decision has not assigned a launch label for observability.",
            pendingDecision: "W-01 availability matrix",
          },
          evidence: [{ label: "Website PRD section 9.1", source: "PRD" }],
          review: { status: "blocked" },
        },
      ],
      pages: [
        {
          ...approvedLaunchPage,
          claimReferences: ["claim-observability-blocked"],
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual({
      scope: "release",
      id: "/security/",
      message:
        "Referenced claim is not publishable: claim-observability-blocked.",
    });
  });

  it("accepts approved launch pages that reference approved reviewed claims", () => {
    const result = validateContentForRelease({
      claims: [approvedClaim],
      pages: [approvedLaunchPage],
    });

    expect(result).toEqual({ valid: true, issues: [] });
  });

  it("allows a draft homepage to reference draft platform claims without publishing them", () => {
    const result = validateContentForRelease({
      claims: [
        {
          id: "claim-preview",
          title: "Preview claim",
          statement: "A draft capability statement.",
          classification: "preview",
          publicationState: "draft",
          evidence: [{ label: "Product note", source: "PRD" }],
          review: { status: "draft" },
        },
      ],
      pages: [
        {
          title: "Glaux | AI your whole team can work with",
          description:
            "Glaux helps teams research, create, and automate with approved company knowledge and tools while keeping governance visible.",
          canonicalPath: "/",
          og: {
            title: "Glaux | AI your whole team can work with",
            description:
              "Glaux helps teams research, create, and automate with approved company knowledge and tools while keeping governance visible.",
            imageAlt: "Monochrome Glaux homepage product preview.",
          },
          launchState: "draft",
          publicationState: "draft",
          claimReviewStatus: "draft",
          claimReferences: ["claim-preview"],
        },
      ],
    });

    expect(result).toEqual({ valid: true, issues: [] });
  });

  it("allows a draft product page to reference draft product claims without publishing them", () => {
    const draftClaims = [
      {
        id: "claim-skillhub-preview",
        title: "Enterprise SkillHub preview",
        statement: "Share trusted ways of working.",
        classification: "preview",
        publicationState: "draft",
        evidence: [{ label: "PRD section 9.2", source: "PRD" }],
        review: { status: "draft" },
      },
      {
        id: "claim-enterprise-mcp-preview",
        title: "Prebuilt enterprise connections preview",
        statement: "Connect the tools your company depends on.",
        classification: "preview",
        publicationState: "draft",
        evidence: [{ label: "PRD section 9.3", source: "PRD" }],
        review: { status: "draft" },
      },
    ];

    const result = validateContentForRelease({
      claims: draftClaims,
      pages: [
        {
          title: "Product | Glaux",
          description:
            "See how Glaux helps employees work with approved company knowledge, tools, approvals, and administrative controls.",
          canonicalPath: "/product/",
          og: {
            title: "Product | Glaux",
            description:
              "See how Glaux helps employees work with approved company knowledge, tools, approvals, and administrative controls.",
            imageAlt:
              "Monochrome Glaux product page work and governance preview.",
          },
          launchState: "draft",
          publicationState: "draft",
          claimReviewStatus: "draft",
          claimReferences: [
            "claim-skillhub-preview",
            "claim-enterprise-mcp-preview",
          ],
        },
      ],
    });

    expect(result).toEqual({ valid: true, issues: [] });
  });
});

describe("content validator required roots", () => {
  it("reports an actionable error when a required content root is missing", () => {
    const directory = join(
      mkdtempSync(join(tmpdir(), "glaux-content-")),
      "src/content/claims",
    );

    expect(() =>
      assertRequiredContentDirectory(directory, "src/content/claims"),
    ).toThrow(
      'Required content directory "src/content/claims" is missing. Create src/content/claims before running content validation.',
    );
  });

  it("reports an actionable error when a required content root is not a directory", () => {
    const directory = join(
      mkdtempSync(join(tmpdir(), "glaux-content-")),
      "claims",
    );
    writeFileSync(directory, "");

    expect(() =>
      assertRequiredContentDirectory(directory, "src/content/claims"),
    ).toThrow(
      'Required content path "src/content/claims" must be a directory. Create src/content/claims/ and add version-controlled content before running content validation.',
    );
  });
});
