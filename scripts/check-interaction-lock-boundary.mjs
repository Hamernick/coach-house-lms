#!/usr/bin/env node

import { promises as fs } from "node:fs"
import path from "node:path"
import * as ts from "typescript"

const ROOT = process.cwd()
const SRC_ROOT = path.join(ROOT, "src")
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"])

const ALLOWED_RAW_IMPORTS = new Map([
  ["@radix-ui/react-dialog", new Set(["src/components/ui/dialog.tsx", "src/components/ui/sheet.tsx"])],
  ["@radix-ui/react-alert-dialog", new Set(["src/components/ui/alert-dialog.tsx"])],
  ["vaul", new Set(["src/components/ui/drawer.tsx"])],
])

function toRepoRelative(absolutePath) {
  return path.relative(ROOT, absolutePath).split(path.sep).join("/")
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

function collectModuleSpecifiers(sourceFile) {
  const specifiers = []

  function visit(node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      specifiers.push(node.moduleSpecifier.text)
    }

    if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      specifiers.push(node.moduleSpecifier.text)
    }

    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "require" &&
      node.arguments.length > 0 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text)
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length > 0 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text)
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return specifiers
}

async function main() {
  const stats = await fs.stat(SRC_ROOT).catch(() => null)
  if (!stats || !stats.isDirectory()) {
    console.error("Interaction lock boundary check failed: src/ not found.")
    process.exit(1)
  }

  const files = await walkFiles(SRC_ROOT)
  const violations = []

  for (const absolutePath of files) {
    const extension = path.extname(absolutePath)
    if (!SOURCE_EXTENSIONS.has(extension)) continue

    const content = await fs.readFile(absolutePath, "utf8")
    const relativePath = toRepoRelative(absolutePath)
    const sourceFile = ts.createSourceFile(
      relativePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      resolveScriptKind(extension),
    )
    const specifiers = collectModuleSpecifiers(sourceFile)

    for (const specifier of specifiers) {
      const allowed = ALLOWED_RAW_IMPORTS.get(specifier)
      if (!allowed) continue
      if (allowed.has(relativePath)) continue

      const allowedTargets = Array.from(allowed).join(", ")
      violations.push(
        `${relativePath}: imports '${specifier}' directly. Use wrapped UI primitives; allowed raw-import files: ${allowedTargets}`,
      )
    }
  }

  if (violations.length > 0) {
    console.error("Interaction lock boundary check failed:\n")
    for (const violation of violations) {
      console.error(`- ${violation}`)
    }
    process.exit(1)
  }

  console.log("Interaction lock boundary check passed.")
}

main().catch((error) => {
  console.error("Unable to run interaction lock boundary check", error)
  process.exit(1)
})
