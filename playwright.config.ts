import { defineConfig, devices } from "@playwright/test";

// The suite runs its own server on its own schema, so the app on 3000 and the
// development data are never touched by what the specs create.
const port = Number(process.env.E2E_PORT ?? 3100);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;
const database = `${(process.env.DB_NAME ?? "librasearch").replace(/_e2e$/, "")}_e2e`;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  globalSetup: "./tests/e2e/global-setup.ts",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm exec tsx scripts/e2e-db.ts && pnpm start -p ${port}`,
    url: baseURL,
    env: { DB_NAME: database, APP_URL: baseURL },
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
