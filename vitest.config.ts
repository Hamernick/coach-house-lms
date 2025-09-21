import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
  test: {
    include: ["tests/acceptance/**/*.test.ts"],
    environment: "node",
    setupFiles: ["./tests/acceptance/test-utils.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
})
