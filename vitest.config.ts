import path from "node:path"
import type { ViteUserConfig } from "vitest/config"

import acceptanceProjects from "./tests/acceptance/projects.json"

const FULL_SETUP = ["./tests/acceptance/test-utils.ts"]
const ACCEPTANCE_FILES = Object.values(acceptanceProjects.projects).flat()

const config: ViteUserConfig = {
  test: {
    environment: "node",
    globals: true,
    include: ACCEPTANCE_FILES,
    maxWorkers: 8,
    setupFiles: FULL_SETUP,
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
