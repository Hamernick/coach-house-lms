import path from "node:path"
import type { UserConfig } from "vitest/config"

const config: UserConfig = {
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
}

export default config
