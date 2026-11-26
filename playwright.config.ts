import { defineConfig } from "@playwright/test";

const port = process.env.E2E_PORT ?? "3010";
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  retries: 0,
  use: {
    baseURL,
    headless: true,
  },
  webServer: {
    command: "node .next/standalone/server.js",
    env: {
      ...process.env,
      PORT: port,
      HOSTNAME: "127.0.0.1",
    },
    url: `${baseURL}/api/health`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
