import { defineConfig } from "@playwright/test";

// Assumes the docker-compose stack (API + all 4 apps) is already running.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    trace: "on-first-retry",
  },
  projects: [
    { name: "client", use: { baseURL: "http://localhost:3002" } },
    { name: "customer", use: { baseURL: "http://localhost:3003" } },
    { name: "management", use: { baseURL: "http://localhost:3001" } },
    { name: "marketNetwork", use: { baseURL: "http://localhost:3004" } },
  ],
});
