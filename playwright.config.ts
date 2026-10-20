import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

/**
 * End-to-end tests (TEST-02). They sign in with username and password, since
 * OAuth cannot run in tests (TEST-03). The database must be migrated; each test
 * registers its own accounts, so no seed is required. Build the app first.
 */
export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  // Tests share one server and database: run them one after the other.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "fr-CA",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Production server: run `bun run build` first (E2E_DEV=1 uses the dev server instead).
    command: process.env.E2E_DEV ? "bun run dev" : "bun run start",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      PORT: String(PORT),
      ROOM_CODE_RATE_LIMIT: "1000",
      // Auth.js redirects (sign-out...) must point at the test server.
      AUTH_URL: `http://localhost:${PORT}`,
      NEXTAUTH_URL: `http://localhost:${PORT}`,
    },
  },
});
