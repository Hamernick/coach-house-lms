#!/usr/bin/env node
import fs from "node:fs"

import {
  formatBytes,
  getDirectorySizeBytes,
  nextCachePath,
} from "./next-cache-utils.mjs"

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`Usage: pnpm clean:next

Removes local Next.js generated output at .next.

This does not touch application source, git history, database data, or Vercel deployments.
`)
  process.exit(0)
}

if (!fs.existsSync(nextCachePath)) {
  console.log("Next cache clean: .next does not exist.")
  process.exit(0)
}

const cacheBytes = getDirectorySizeBytes(nextCachePath)
fs.rmSync(nextCachePath, { recursive: true, force: true })
console.log(`Next cache clean: removed .next (${formatBytes(cacheBytes)}).`)
