import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { parse as parseYaml } from "yaml";
import { validateContentForRelease } from "../src/lib/content/validate.ts";

const root = new URL("..", import.meta.url).pathname;

function walkFiles(directory: string, extensions: Set<string>): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return walkFiles(path, extensions);
    }
    return entry.isFile() && extensions.has(extname(entry.name)) ? [path] : [];
  });
}

function parseFrontmatter(path: string): Record<string, unknown> {
  const source = readFileSync(path, "utf8");
  const match = /^---\n([\s\S]*?)\n---/u.exec(source);
  if (!match) {
    throw new Error(`${relative(root, path)} is missing frontmatter.`);
  }

  const frontmatter = match[1];
  if (!frontmatter) {
    throw new Error(`${relative(root, path)} is missing frontmatter.`);
  }

  const parsed = parseYaml(frontmatter);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${relative(root, path)} frontmatter must be an object.`);
  }

  return parsed as Record<string, unknown>;
}

const claimsDirectory = join(root, "src/content/claims");
const pagesDirectory = join(root, "src/content/pages");

const claims = statSync(claimsDirectory).isDirectory()
  ? walkFiles(claimsDirectory, new Set([".json"])).map((path) =>
      JSON.parse(readFileSync(path, "utf8")),
    )
  : [];
const pages = statSync(pagesDirectory).isDirectory()
  ? walkFiles(pagesDirectory, new Set([".md", ".mdx"])).map(parseFrontmatter)
  : [];

const result = validateContentForRelease({ claims, pages });

if (!result.valid) {
  for (const issue of result.issues) {
    console.error(`[${issue.scope}] ${issue.id}: ${issue.message}`);
  }
  process.exitCode = 1;
}
