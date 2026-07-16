import { defineConfig } from "@playwright/test";

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
    browserName: "chromium",
    launchOptions: { args: ["--disable-gpu"] },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off"
  },
  webServer: {
    command: "node tests/e2e/static-server.js",
    url: "http://127.0.0.1:4173/index.html",
    reuseExistingServer: !isCI,
    timeout: 10_000
  }
});
