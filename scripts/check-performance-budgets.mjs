#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const budgets = [
  { routeKey: "/(dashboard)/dashboard/page", label: "/dashboard", maxFirstLoadKB: 750 },
  { routeKey: "/(admin)/admin/page", label: "/admin", maxFirstLoadKB: 400 },
]

const buildDir = ".next"
const results = []
const failures = []

const manifestPath = path.join(process.cwd(), ".next/app-build-manifest.json")
const buildManifestPath = path.join(process.cwd(), ".next/build-manifest.json")
const appPathsManifestPath = path.join(process.cwd(), ".next/server/app-paths-manifest.json")

let getFilesForRoute

if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  const polyfills = new Set(manifest.polyfillFiles ?? [])

  getFilesForRoute = (routeKey) => {
    const pageFiles = manifest.pages?.[routeKey]
    if (!pageFiles || pageFiles.length === 0) {
      return { error: `No files found for route key '${routeKey}'. Update the budget script.` }
    }

    return { files: new Set([...pageFiles, ...polyfills]) }
  }
} else if (fs.existsSync(buildManifestPath) && fs.existsSync(appPathsManifestPath)) {
  const buildManifest = JSON.parse(fs.readFileSync(buildManifestPath, "utf8"))
  const appPathsManifest = JSON.parse(fs.readFileSync(appPathsManifestPath, "utf8"))
  const shared = new Set([...(buildManifest.rootMainFiles ?? []), ...(buildManifest.polyfillFiles ?? [])])

  getFilesForRoute = (routeKey) => {
    const entry = appPathsManifest[routeKey]
    if (!entry) {
      return { error: `No entry found for route key '${routeKey}' in app paths manifest.` }
    }

    if (entry === "app-edge-has-no-entrypoint") {
      return { error: `Route '${routeKey}' runs on the edge runtime without a client entry. Update budgets.` }
    }

    const clientManifestPath = path.join(
      process.cwd(),
      ".next/server",
      entry.replace(/\.js$/i, "_client-reference-manifest.js"),
    )

    if (!fs.existsSync(clientManifestPath)) {
      return { error: `Missing client reference manifest for route '${routeKey}'.` }
    }

    const source = fs.readFileSync(clientManifestPath, "utf8")
    const assignmentIndex = source.lastIndexOf("=")
    if (assignmentIndex === -1) {
      return { error: `Malformed client manifest for route '${routeKey}'.` }
    }

    const jsonSlice = source.slice(assignmentIndex + 1).trim()
    const jsonPayload = jsonSlice.endsWith(";") ? jsonSlice.slice(0, -1) : jsonSlice

    let parsed
    try {
      parsed = JSON.parse(jsonPayload)
    } catch (error) {
      return { error: `Failed to parse client manifest for '${routeKey}': ${error.message}` }
    }

    const files = new Set(shared)
    const clientModules = parsed.clientModules ?? {}

    for (const moduleRecord of Object.values(clientModules)) {
      if (!moduleRecord || moduleRecord.async) {
        continue
      }

      const chunks = moduleRecord.chunks ?? []
      for (const chunk of chunks) {
        if (typeof chunk !== "string") {
          continue
        }

        const normalized = chunk
          .replace(/^\/_next\//, "")
          .replace(/^\.\//, "")
          .split("?")[0]

        files.add(normalized)
      }
    }

    return { files }
  }
} else {
  console.error("Performance budget check failed: missing Next.js build manifests. Run 'next build' first.")
  process.exit(1)
}

for (const { routeKey, label, maxFirstLoadKB } of budgets) {
  const { files, error } = getFilesForRoute(routeKey)
  if (error) {
    failures.push(error)
    continue
  }

  let totalBytes = 0
  const missing = []

  for (const file of files) {
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
