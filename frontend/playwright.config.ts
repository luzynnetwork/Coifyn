import { defineConfig } from "@playwright/test";

// One entry per app. The package name is the npm workspace name (note
// @coifyn/marketnetwork is lower-case even though its directory is marketNetwork).
const apps = [
  { pkg: "@coifyn/management", port: 3001 },
  { pkg: "@coifyn/client", port: 3002 },
  { pkg: "@coifyn/customer", port: 3003 },
  { pkg: "@coifyn/marketnetwork", port: 3004 },
];

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    trace: "on-first-retry",
  },
  // `next start` serves the build produced by the preceding `turbo run build`
  // step. Each spec pins its own baseURL, so there are no projects here — one
  // project per app would re-run every spec against every app's port.
  webServer: [
    // The real API on :4000, against a fresh throwaway database and a
    // restricted role so Row-Level Security is enforced. Needs `npm run build`
    // in backend/ first and a Postgres superuser at E2E_SUPERUSER_URL (the
    // docker-compose database by default). Never reused: every run starts empty.
    {
      command: "node scripts/ui-e2e-server.mjs",
      cwd: "../backend",
      url: "http://localhost:4000/health",
      reuseExistingServer: false,
      timeout: 120_000,
      // Show the API's log (LOG_LEVEL=warn) in the test output, so a 500 in CI
      // comes with its stack trace instead of only a correlation id.
      stdout: "pipe",
      env: {
        ...(process.env as Record<string, string>),
        E2E_SUPERUSER_URL:
          process.env.E2E_SUPERUSER_URL ??
          "postgresql://coifyn:coifyn@localhost:5432/postgres",
      },
    },
    ...apps.map(({ pkg, port }) => ({
      command: `npm run start --workspace=${pkg}`,
      url: `http://localhost:${port}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    })),
  ],
});
