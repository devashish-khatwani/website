import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import { getCanonicalSiteOrigin } from "./src/lib/site";

export default defineConfig({
  output: "static",
  site: getCanonicalSiteOrigin(),
  integrations: [mdx()],
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ["www.glauxagent.com"],
    },
  },
});
