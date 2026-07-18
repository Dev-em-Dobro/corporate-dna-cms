import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));

export default defineConfig({
  // Alias only "@/..." so package imports like "@node-rs/argon2" are untouched.
  resolve: { alias: [{ find: /^@\//, replacement: `${root}/` }] },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
