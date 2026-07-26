import { defineConfig, devices } from "@playwright/test";

const pagesPort = process.env.GLAUX_PAGES_PORT ?? "8788";
const pagesBaseUrl = `http://127.0.0.1:${pagesPort}`;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL: pagesBaseUrl,
    launchOptions: {
      args: ["--host-resolver-rules=MAP www.glauxagent.com 127.0.0.1"],
    },
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run preview:pages",
    url: pagesBaseUrl,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
