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
  webServer: apps.map(({ pkg, port }) => ({
    command: `npm run start --workspace=${pkg}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  })),
});
