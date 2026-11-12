import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { buildSitemapXml } from "../lib/site";

export const prerender = true;

export const GET: APIRoute = async () => {
  const posts = await getCollection("blog");
  return new Response(
    buildSitemapXml(
      process.env,
      posts.map((post) => `/blog/${post.id}/`),
    ),
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
      },
    },
  );
};
