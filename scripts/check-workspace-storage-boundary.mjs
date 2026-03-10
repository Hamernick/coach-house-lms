#!/usr/bin/env node

import { promises as fs } from "node:fs"
import path from "node:path"

const ROOT = process.cwd()
const SRC_ROOT = path.join(ROOT, "src")
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"])

const FORBIDDEN_PATTERNS = [
  "workspace_board_v1",
  "workspace_collaboration_v1",
]

async function fileExists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

async function walkFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const next = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(next)))
      continue
    }
    files.push(next)
  }

  return files
}

function toRepoRelative(absolutePath) {
  return path.relative(ROOT, absolutePath).split(path.sep).join("/")
}

async function main() {
  if (!(await fileExists(SRC_ROOT))) {
    console.error("Workspace storage boundary check failed: src/ not found.")
    process.exit(1)
  }

  const files = await walkFiles(SRC_ROOT)
  const violations = []

  for (const absolutePath of files) {
    const extension = path.extname(absolutePath)
    if (!SOURCE_EXTENSIONS.has(extension)) continue

    const relativePath = toRepoRelative(absolutePath)
    const content = await fs.readFile(absolutePath, "utf8")

    for (const forbiddenPattern of FORBIDDEN_PATTERNS) {
      if (content.includes(forbiddenPattern)) {
        violations.push(`${relativePath}: found forbidden legacy workspace key '${forbiddenPattern}'`)
      }
    }
  }

  if (violations.length > 0) {
    console.error("Workspace storage boundary check failed:\n")
    for (const violation of violations) {
      console.error(`- ${violation}`)
    }
    process.exit(1)
  }

  console.log("Workspace storage boundary check passed.")
}

main().catch((error) => {
  console.error("Unable to run workspace storage boundary check", error)
  process.exit(1)
})
