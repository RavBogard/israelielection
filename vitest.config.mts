import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  // testTimeout: the page tests load a whole page cold (2s alone, past 5s on a busy runner); the polls job's
  // election-night gate runs this suite before every exit-poll commit and must not fail on a slow machine.
  test: { testTimeout: 20_000, setupFiles: ["lib/i18n/he/register.ts"], include: ["**/*.test.ts"], exclude: ["**/node_modules/**", ".next/**", ".claude/**"] },
});
