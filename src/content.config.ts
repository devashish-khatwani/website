import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { claimEntrySchema, pageMetadataSchema } from "./lib/content/schemas";

const pages = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/pages" }),
  schema: pageMetadataSchema,
});

const claims = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/claims" }),
  schema: claimEntrySchema,
});

export const collections = { pages, claims };
