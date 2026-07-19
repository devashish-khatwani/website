import {
  claimEntrySchema,
  type ClaimEntry,
  pageMetadataSchema,
  type PageMetadata,
} from "./schemas.ts";

export type ContentValidationIssue = {
  scope: "claim" | "page" | "release";
  id: string;
  message: string;
};

export type RawContentForRelease = {
  claims: unknown[];
  pages: unknown[];
};

export type ContentValidationResult = {
  valid: boolean;
  issues: ContentValidationIssue[];
};

const isReleasePage = (page: PageMetadata) =>
  page.launchState === "launch" || page.publicationState === "public";

const isPublishableClaim = (claim: ClaimEntry) =>
  claim.publicationState === "approved" &&
  claim.review?.status === "approved" &&
  claim.blocked === undefined;

function fallbackId(raw: unknown, key: string): string {
  return typeof raw === "object" &&
    raw !== null &&
    key in raw &&
    typeof raw[key as keyof typeof raw] === "string"
    ? raw[key as keyof typeof raw]
    : "unknown";
}

export function validateContentForRelease(
  content: RawContentForRelease,
): ContentValidationResult {
  const issues: ContentValidationIssue[] = [];
  const claims = new Map<string, ClaimEntry>();
  const pages: PageMetadata[] = [];

  for (const rawClaim of content.claims) {
    const parsed = claimEntrySchema.safeParse(rawClaim);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        issues.push({
          scope: "claim",
          id: fallbackId(rawClaim, "id"),
          message: issue.message,
        });
      }
      continue;
    }

    if (claims.has(parsed.data.id)) {
      issues.push({
        scope: "claim",
        id: parsed.data.id,
        message: "Claim IDs must be unique.",
      });
    }

    claims.set(parsed.data.id, parsed.data);
  }

  for (const rawPage of content.pages) {
    const parsed = pageMetadataSchema.safeParse(rawPage);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        issues.push({
          scope: "page",
          id: fallbackId(rawPage, "canonicalPath"),
          message: issue.message,
        });
      }
      continue;
    }

    pages.push(parsed.data);
  }

  for (const page of pages) {
    if (!isReleasePage(page)) {
      continue;
    }

    if (page.claimReviewStatus !== "approved") {
      issues.push({
        scope: "release",
        id: page.canonicalPath,
        message: "Launch or public pages require approved claim review.",
      });
    }

    if (page.claimReferences.length === 0) {
      issues.push({
        scope: "release",
        id: page.canonicalPath,
        message: "Launch or public pages require at least one claim reference.",
      });
    }

    for (const claimId of page.claimReferences) {
      const claim = claims.get(claimId);
      if (!claim) {
        issues.push({
          scope: "release",
          id: page.canonicalPath,
          message: `Missing claim reference: ${claimId}.`,
        });
        continue;
      }

      if (!isPublishableClaim(claim)) {
        issues.push({
          scope: "release",
          id: page.canonicalPath,
          message: `Referenced claim is not publishable: ${claimId}.`,
        });
      }
    }
  }

  return { valid: issues.length === 0, issues };
}
