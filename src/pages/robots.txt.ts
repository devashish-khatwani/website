import type { APIRoute } from "astro";
import { buildRobotsTxt } from "../lib/site";

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(buildRobotsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
