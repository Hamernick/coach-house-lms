import path from "node:path"
import type { ViteUserConfig } from "vitest/config"

import acceptanceProjects from "./tests/acceptance/projects.json"

const FULL_SETUP = ["./tests/acceptance/test-utils.ts"]

const config: ViteUserConfig = {
  test: {
    environment: "node",
    globals: true,
    maxWorkers: 8,
    projects: [
      {
        extends: true,
        test: {
          name: "behavior",
          include: acceptanceProjects.projects.behavior,
          setupFiles: FULL_SETUP,
        },
      },
      {
        extends: true,
        test: {
          name: "contract",
          include: acceptanceProjects.projects.contract,
          setupFiles: [],
        },
      },
      {
        extends: true,
        test: {
          name: "cli",
          include: acceptanceProjects.projects.cli,
          setupFiles: FULL_SETUP,
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: acceptanceProjects.projects.integration,
          setupFiles: FULL_SETUP,
        },
      },
    ],
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
