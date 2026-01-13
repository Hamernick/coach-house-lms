import path from "node:path"
import type { ViteUserConfig } from "vitest/config"

const config: ViteUserConfig = {
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
