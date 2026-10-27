import path from "node:path";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./monitor-browser",
  testMatch: "*.spec.ts",
  workers: 1,
  retries: 1,
  timeout: 45000,
  outputDir: "../../.vercel/platform-monitor-browser",
  reporter: [
    ["line"],
    [
      "json",
      {
        outputFile: path.resolve(
          ".vercel/platform-monitor-browser/result.json",
        ),
      },
    ],
  ],
  use: {
    headless: true,
    trace: "off",
    video: "off",
    screenshot: "off",
    ...(process.env.PLATFORM_MONITOR_BROWSER_CHANNEL
      ? { channel: process.env.PLATFORM_MONITOR_BROWSER_CHANNEL }
      : {}),
  },
});
