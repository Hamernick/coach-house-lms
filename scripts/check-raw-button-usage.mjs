#!/usr/bin/env node

import { promises as fs } from "node:fs"
import path from "node:path"

const ROOT = process.cwd()
const TARGET_DIRECTORIES = [
  path.join(ROOT, "src", "components"),
  path.join(ROOT, "src", "app"),
]

const SUPPORTED_EXTENSIONS = new Set([".tsx", ".jsx"])
const RAW_BUTTON_PATTERN = /<button\b/gu
const RAW_BUTTON_MAX = 5

const RAW_BUTTON_ALLOWLIST = new Set([])

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
  const errors = []
  const warnings = []
  const rawButtonCounts = new Map()

  const roots = []
  for (const targetDirectory of TARGET_DIRECTORIES) {
    if (await fileExists(targetDirectory)) {
      roots.push(targetDirectory)
    }
  }

  const files = []
  for (const root of roots) {
    files.push(...(await walkFiles(root)))
  }

  let totalRawButtons = 0

  for (const absolutePath of files) {
    const relativePath = toRepoRelative(absolutePath)
    const extension = path.extname(relativePath)
    if (!SUPPORTED_EXTENSIONS.has(extension)) continue

    const content = await fs.readFile(absolutePath, "utf8")
    const matches = content.match(RAW_BUTTON_PATTERN)
    const count = matches?.length ?? 0
    if (count === 0) continue

    totalRawButtons += count
    rawButtonCounts.set(relativePath, count)

    if (!RAW_BUTTON_ALLOWLIST.has(relativePath)) {
      errors.push(`Raw <button> usage requires review/allowlist entry: ${relativePath} (${count})`)
    }
  }

  for (const allowlistedPath of RAW_BUTTON_ALLOWLIST) {
    if (!rawButtonCounts.has(allowlistedPath)) {
      warnings.push(`Allowlist entry has no raw <button> usage and can be removed: ${allowlistedPath}`)
    }
  }

  if (totalRawButtons > RAW_BUTTON_MAX) {
    errors.push(
      `Raw <button> count exceeded max (${RAW_BUTTON_MAX}): current ${totalRawButtons}`,
    )
  }

  if (warnings.length > 0) {
    console.log("Raw button usage warnings:")
    for (const warning of warnings) {
      console.log(`- ${warning}`)
    }
  }

  if (errors.length > 0) {
    console.error("Raw button usage check failed:")
    for (const error of errors) {
      console.error(`- ${error}`)
    }
    process.exit(1)
  }

  console.log(`Raw button usage check passed (${totalRawButtons}/${RAW_BUTTON_MAX}).`)
}

main().catch((error) => {
  console.error("Unable to run raw button usage check", error)
  process.exit(1)
})
