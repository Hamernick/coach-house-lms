#!/usr/bin/env node

import { promises as fs } from "node:fs"
import path from "node:path"

const ROOT = process.cwd()
const TOKEN_OWNER_PATH = "src/components/workspace/workspace-tutorial-theme.ts"
const TARGET_FILES = [
  "src/components/workspace/workspace-tutorial-callout.tsx",
  "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/shortcuts/workspace-card-shortcut-button.tsx",
  "src/features/workspace-accelerator-card/components/workspace-accelerator-header-picker.tsx",
  "src/features/workspace-accelerator-card/components/workspace-accelerator-tutorial-guard-tooltip.tsx",
]
const FORBIDDEN_CLASS_FRAGMENTS = [
  "bg-muted/70",
  "supports-[backdrop-filter]:bg-muted/55",
  "dark:bg-input/30",
  "dark:border-input",
  "bg-foreground",
  "dark:bg-white",
]

async function run() {
  const errors = []

  for (const relativePath of TARGET_FILES) {
    if (relativePath === TOKEN_OWNER_PATH) continue

    const absolutePath = path.join(ROOT, relativePath)
    const sourceText = await fs.readFile(absolutePath, "utf8")

    for (const fragment of FORBIDDEN_CLASS_FRAGMENTS) {
      if (!sourceText.includes(fragment)) continue
      errors.push(
        `${relativePath}: raw tutorial surface fragment '${fragment}' should come from ${TOKEN_OWNER_PATH}, not a feature wrapper.`,
      )
    }
  }

  if (errors.length > 0) {
    console.error("Workspace tutorial surface token check failed:\n")
    for (const error of errors) {
      console.error(`- ${error}`)
    }
    process.exit(1)
  }

  console.log("Workspace tutorial surface token check passed.")
}

run().catch((error) => {
  console.error("Unable to run workspace tutorial surface token check", error)
  process.exit(1)
})
