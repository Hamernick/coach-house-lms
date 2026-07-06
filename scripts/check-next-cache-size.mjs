#!/usr/bin/env node
import fs from "node:fs"

import {
  formatBytes,
  getDirectorySizeBytes,
  nextCachePath,
} from "./next-cache-utils.mjs"

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`Usage: pnpm check:next-cache

Checks local Next.js generated output size.

Environment:
  NEXT_CACHE_MAX_GB  Maximum allowed .next size in GB. Default: 5
`)
  process.exit(0)
}

const maxCacheGB = Number(process.env.NEXT_CACHE_MAX_GB ?? "5")
const maxCacheBytes = maxCacheGB * 1024 ** 3

if (!fs.existsSync(nextCachePath)) {
  console.log("Next cache check: .next does not exist.")
  process.exit(0)
}

const cacheBytes = getDirectorySizeBytes(nextCachePath)
const cacheLabel = formatBytes(cacheBytes)
const maxLabel = formatBytes(maxCacheBytes)

console.log(`Next cache check: .next is ${cacheLabel} (limit ${maxLabel}).`)

if (cacheBytes > maxCacheBytes) {
  console.error(
    `Next cache is over the local limit. Run 'pnpm clean:next' before restarting dev.`
  )
  process.exit(1)
}
