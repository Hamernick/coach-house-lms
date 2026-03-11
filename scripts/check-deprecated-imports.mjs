#!/usr/bin/env node

import { promises as fs } from "node:fs"
import path from "node:path"
import * as ts from "typescript"

const ROOT = process.cwd()
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"])
const TARGET_DIRECTORIES = ["src", "tests", "scripts"]

function toRepoRelative(absolutePath) {
  return path.relative(ROOT, absolutePath).split(path.sep).join("/")
}

function hasDeprecatedSegment(candidate) {
  return candidate.split("/").includes("deprecated")
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
    case ".mjs":
      return ts.ScriptKind.JS
    case ".cjs":
      return ts.ScriptKind.JS
    default:
      return ts.ScriptKind.Unknown
  }
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
  const errors = []

  for (const target of TARGET_DIRECTORIES) {
    const absoluteTarget = path.join(ROOT, target)
    const stat = await fs.stat(absoluteTarget).catch(() => null)
    if (!stat?.isDirectory()) continue

    const files = await walkFiles(absoluteTarget)

    for (const absolutePath of files) {
      const extension = path.extname(absolutePath)
      if (!SOURCE_EXTENSIONS.has(extension)) continue

      const repoRelative = toRepoRelative(absolutePath)
      if (hasDeprecatedSegment(repoRelative)) continue

      const sourceText = await fs.readFile(absolutePath, "utf8")
      const sourceFile = ts.createSourceFile(
        repoRelative,
        sourceText,
        ts.ScriptTarget.Latest,
        true,
        resolveScriptKind(extension),
      )

      for (const specifier of collectModuleSpecifiers(sourceFile)) {
        if (!hasDeprecatedSegment(specifier)) continue
        errors.push(`${repoRelative}: active code may not import archived modules (found '${specifier}')`)
      }
    }
  }

  if (errors.length > 0) {
    console.error("Deprecated import check failed:\n")
    for (const error of errors) {
      console.error(`- ${error}`)
    }
    process.exit(1)
  }

  console.log("Deprecated import check passed.")
}

main().catch((error) => {
  console.error("Unable to run deprecated import check", error)
  process.exit(1)
})
