#!/usr/bin/env node

import { promises as fs } from "node:fs"
import path from "node:path"
import * as ts from "typescript"

const ROOT = process.cwd()
const SRC_ROOT = path.join(ROOT, "src")
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"])
const ATTRIBUTE_ALLOWLIST = new Set(["data-react-grab-role"])
const OWNER_HELPER_PATH = "src/components/dev/react-grab-surface.ts"

function toRepoRelative(absolutePath) {
  return path.relative(ROOT, absolutePath).split(path.sep).join("/")
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

function resolveScriptKind(extension) {
  switch (extension) {
    case ".ts":
      return ts.ScriptKind.TS
    case ".tsx":
      return ts.ScriptKind.TSX
    case ".js":
      return ts.ScriptKind.JS
    case ".jsx":
      return ts.ScriptKind.JSX
    default:
      return ts.ScriptKind.Unknown
  }
}

function collectReactGrabJsxAttributes(sourceFile) {
  const attributes = []

  function visit(node) {
    if (
      ts.isJsxAttribute(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text.startsWith("data-react-grab")
    ) {
      attributes.push(node.name.text)
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return attributes
}

async function run() {
  const files = await walkFiles(SRC_ROOT)
  const errors = []

  for (const absolutePath of files) {
    const extension = path.extname(absolutePath)
    if (!SOURCE_EXTENSIONS.has(extension)) continue

    const repoRelative = toRepoRelative(absolutePath)
    if (repoRelative === OWNER_HELPER_PATH) continue

    const sourceText = await fs.readFile(absolutePath, "utf8")
    const sourceFile = ts.createSourceFile(
      repoRelative,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      resolveScriptKind(extension),
    )

    for (const attributeName of collectReactGrabJsxAttributes(sourceFile)) {
      if (ATTRIBUTE_ALLOWLIST.has(attributeName)) continue
      errors.push(
        `${repoRelative}: raw '${attributeName}' authoring is not allowed. Use src/components/dev/react-grab-surface.ts helpers.`,
      )
    }
  }

  if (errors.length > 0) {
    console.error("React Grab ownership check failed:\n")
    for (const error of errors) {
      console.error(`- ${error}`)
    }
    process.exit(1)
  }

  console.log("React Grab ownership check passed.")
}

run().catch((error) => {
  console.error("Unable to run React Grab ownership check", error)
  process.exit(1)
})
