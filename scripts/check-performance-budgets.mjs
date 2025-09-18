#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const budgets = [
  { routeKey: "/(dashboard)/dashboard/page", label: "/dashboard", maxFirstLoadKB: 750 },
  { routeKey: "/(admin)/admin/page", label: "/admin", maxFirstLoadKB: 400 },
]

const manifestPath = path.join(process.cwd(), ".next/app-build-manifest.json")

if (!fs.existsSync(manifestPath)) {
  console.error(`Performance budget check failed: missing ${manifestPath}. Run 'next build' first.`)
  process.exit(1)
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
const polyfills = new Set(manifest.polyfillFiles ?? [])
const buildDir = ".next"

const failures = []
const results = []

for (const { routeKey, label, maxFirstLoadKB } of budgets) {
  const pageFiles = manifest.pages?.[routeKey]
  if (!pageFiles || pageFiles.length === 0) {
    failures.push(`No files found for route key '${routeKey}'. Update the budget script.`)
    continue
  }

  const uniqueFiles = new Set([...pageFiles, ...polyfills])
  let totalBytes = 0
  const missing = []

  for (const file of uniqueFiles) {
    const filePath = path.join(buildDir, file)
    try {
      const stats = fs.statSync(filePath)
      totalBytes += stats.size
    } catch {
      missing.push(file)
    }
  }

  if (missing.length > 0) {
    failures.push(`Missing build assets for ${label}: ${missing.join(", ")}`)
    continue
  }

  const totalKB = totalBytes / 1024
  const rounded = Number(totalKB.toFixed(1))
  results.push(`${label}: ${rounded}KB (budget ≤ ${maxFirstLoadKB}KB)`)

  if (totalKB > maxFirstLoadKB) {
    failures.push(`${label} first-load bundle is ${rounded}KB (budget ≤ ${maxFirstLoadKB}KB)`) 
  }
}

results.forEach((line) => console.log(line))

if (failures.length > 0) {
  console.error("Performance budgets failed:")
  failures.forEach((line) => console.error(`  - ${line}`))
  process.exit(1)
}

console.log("Performance budgets passed ✅")
