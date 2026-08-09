#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

export const nextCachePath = path.join(process.cwd(), ".next")

export function formatBytes(bytes) {
  if (bytes === 0) return "0B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  )
  const value = bytes / 1024 ** unitIndex
  return `${value >= 10 ? value.toFixed(1) : value.toFixed(2)}${units[unitIndex]}`
}

export function getDirectorySizeBytes(directoryPath) {
  let total = 0
  const stack = [directoryPath]

  while (stack.length > 0) {
    const currentPath = stack.pop()
    if (!currentPath) continue

    let entries
    try {
      entries = fs.readdirSync(currentPath, { withFileTypes: true })
    } catch {
      continue
    }

    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name)
      if (entry.isDirectory()) {
        stack.push(entryPath)
        continue
      }

      try {
        total += fs.statSync(entryPath).size
      } catch {
        // Ignore files removed by a concurrent dev/build process.
      }
    }
  }

  return total
}
