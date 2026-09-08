import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(globalThis.process.env.CI);

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.e2e.js",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off"
  },
  projects: [
    {
      name: "chromium",
      testIgnore: "**/touch.e2e.js",
      use: { browserName: "chromium", launchOptions: { args: ["--disable-gpu"] } }
    },
    {
      name: "webkit",
      testMatch: "**/eq-curves.e2e.js",
      use: { browserName: "webkit" }
    },
    {
      name: "webkit-touch",
      testMatch: "**/touch.e2e.js",
      use: { ...devices["iPhone 13"], browserName: "webkit" }
    }
  ],
  webServer: {
    command: "node tests/e2e/static-server.js",
    url: "http://127.0.0.1:4173/index.html",
    reuseExistingServer: !isCI,
    timeout: 10_000
  }
});
