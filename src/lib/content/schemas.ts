import { z } from "astro/zod";

export const claimEvidenceClasses = [
  "verified-implementation",
  "verified-architecture",
  "planned",
  "preview",
  "coming-soon",
  "external-alignment",
] as const;

export const claimPublicationStates = ["draft", "approved", "retired"] as const;
export const pageLaunchStates = ["draft", "launch", "post-launch"] as const;
export const pagePublicationStates = ["draft", "public", "retired"] as const;
export const claimReviewStatuses = [
  "draft",
  "approved",
  "blocked",
  "retired",
] as const;

const optionalUriSchema = z
  .string()
  .regex(/^(https?:\/\/|\.{0,2}\/)/u)
  .optional();

export const claimEntrySchema = z
  .object({
    id: z.string().regex(/^claim-[a-z0-9]+(?:-[a-z0-9]+)*$/u),
    title: z.string().min(3),
    statement: z.string().min(12),
    classification: z.enum(claimEvidenceClasses).optional(),
    publicationState: z.enum(claimPublicationStates),
    blocked: z
      .object({
        reason: z.string().min(12),
        pendingDecision: z.string().min(3),
      })
      .optional(),
    evidence: z
      .array(
        z.object({
          label: z.string().min(3),
          source: z.string().min(3),
          href: optionalUriSchema,
        }),
      )
      .default([]),
    owner: z.string().min(2).optional(),
    review: z
      .object({
        status: z.enum(claimReviewStatuses),
        reviewer: z.string().min(2).optional(),
        reviewedAt: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/u)
          .optional(),
        notes: z.string().min(3).optional(),
      })
      .optional(),
  })
  .superRefine((claim, context) => {
    if (!claim.blocked && !claim.classification) {
      context.addIssue({
        code: "custom",
        path: ["classification"],
        message: "Non-blocked claims require a classification.",
      });
    }

    if (claim.publicationState === "approved") {
      if (!claim.classification) {
        context.addIssue({
          code: "custom",
          path: ["classification"],
          message: "Approved claims require a classification.",
        });
      }

      if (claim.evidence.length === 0) {
        context.addIssue({
          code: "custom",
          path: ["evidence"],
          message: "Approved claims require at least one evidence item.",
        });
      }

      if (!claim.owner) {
        context.addIssue({
          code: "custom",
          path: ["owner"],
          message: "Approved claims require an owner.",
        });
      }

      if (claim.review?.status !== "approved") {
        context.addIssue({
          code: "custom",
          path: ["review", "status"],
          message: "Approved claims require approved review status.",
        });
      }

      if (!claim.review?.reviewer) {
        context.addIssue({
          code: "custom",
          path: ["review", "reviewer"],
          message: "Approved claims require a reviewer.",
        });
      }

      if (!claim.review?.reviewedAt) {
        context.addIssue({
          code: "custom",
          path: ["review", "reviewedAt"],
          message: "Approved claims require a review date.",
        });
      }
    }

    if (claim.blocked && claim.publicationState !== "draft") {
      context.addIssue({
        code: "custom",
        path: ["publicationState"],
        message: "Blocked claims must remain draft.",
      });
    }

    if (claim.blocked && claim.review?.status === "approved") {
      context.addIssue({
        code: "custom",
        path: ["review", "status"],
        message: "Blocked claims cannot have approved review status.",
      });
    }
  });

export const pageMetadataSchema = z
  .object({
    title: z.string().min(3).max(80),
    description: z.string().min(20).max(180),
    canonicalPath: z
      .string()
      .regex(/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/?)*$/u)
      .refine((path) => !path.includes("//"), {
        message: "Canonical paths cannot contain duplicate slashes.",
      }),
    og: z.object({
      title: z.string().min(3).max(90),
      description: z.string().min(20).max(200),
      image: optionalUriSchema,
      imageAlt: z.string().min(12).max(160),
    }),
    launchState: z.enum(pageLaunchStates),
    publicationState: z.enum(pagePublicationStates),
    claimReviewStatus: z.enum(claimReviewStatuses),
    claimReferences: z.array(z.string()).default([]),
  })
  .superRefine((page, context) => {
    if (
      page.publicationState === "public" &&
      page.claimReviewStatus !== "approved"
    ) {
      context.addIssue({
        code: "custom",
        path: ["claimReviewStatus"],
        message: "Public pages require approved claim review.",
      });
    }
  });

export type ClaimEntry = z.infer<typeof claimEntrySchema>;
export type PageMetadata = z.infer<typeof pageMetadataSchema>;
