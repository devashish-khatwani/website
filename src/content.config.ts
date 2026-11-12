import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import {
  blogPostSchema,
  claimEntrySchema,
  pageMetadataSchema,
} from "./lib/content/schemas";

const pages = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/pages" }),
  schema: pageMetadataSchema,
});

const claims = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/claims" }),
  schema: claimEntrySchema,
});

const blog = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/blog" }),
  schema: blogPostSchema,
});

export const collections = { pages, claims, blog };
