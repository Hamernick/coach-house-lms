#!/usr/bin/env node

import { promises as fs } from "node:fs"
import path from "node:path"
import * as ts from "typescript"

const ROOT = process.cwd()
const TARGET_DIRECTORIES = [
  path.join(ROOT, "src", "components"),
  path.join(ROOT, "src", "app"),
]

const SUPPORTED_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".css"])
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"])
const KEBAB_CASE_FILENAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const TEMPORARY_NAMING_PATTERN = /(^|\/)(home[0-9]+|tmp|temp)(\/|$)/u
const TEMPORARY_NAMING_ALLOWLIST = new Set()
const SHIM_FILE_ALLOWLIST = new Set([
  "src/components/organization/org-profile-card.tsx",
  "src/components/organization/org-profile-card/tabs/company-tab/edit-sections.tsx",
  "src/components/programs/program-wizard/helpers.ts",
])

// Hard cap for component-like files. Existing over-budget files remain temporarily allowlisted
// while being actively decomposed in follow-up refactor passes.
const COMPONENT_LINE_BUDGET = 450
const COMPONENT_LINE_BUDGET_ALLOWLIST = new Set()
const SOURCE_LINE_BUDGET = 500
const SOURCE_LINE_BUDGET_ALLOWLIST = new Set()
const LINE_BUDGET_WARNING_THRESHOLD = 0.9

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

function isRoutePrivateComponent(relativePath) {
  return relativePath.startsWith("src/app/") && relativePath.includes("/_components/")
}

function isComponentFile(relativePath) {
  return relativePath.startsWith("src/components/")
}

function shouldValidateNaming(relativePath, extension) {
  if (!SUPPORTED_EXTENSIONS.has(extension)) return false
  if (isComponentFile(relativePath)) return true
  if (isRoutePrivateComponent(relativePath)) return true
  return false
}

function validateKebabCaseFilename(relativePath) {
  const parsed = path.parse(relativePath)
  if (parsed.name === "index") return null
  if (parsed.name === "types") return null
  if (KEBAB_CASE_FILENAME.test(parsed.name)) return null
  return `Use kebab-case filename: ${relativePath}`
}

async function countLines(absolutePath) {
  const content = await fs.readFile(absolutePath, "utf8")
  if (content.length === 0) return 0
  return content.split(/\r?\n/u).length
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

function isDirective(statement, value) {
  return (
    ts.isExpressionStatement(statement) &&
    ts.isStringLiteral(statement.expression) &&
    statement.expression.text === value
  )
}

function isPureReexportShim(relativePath, sourceText, extension) {
  const scriptKind = resolveScriptKind(extension)
  const sourceFile = ts.createSourceFile(
    relativePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  )

  if (sourceFile.statements.length === 0) return false

  return sourceFile.statements.every((statement) => {
    return (
      ts.isExportDeclaration(statement) ||
      isDirective(statement, "use client") ||
      isDirective(statement, "use server")
    )
  })
}

async function hasSameNameSiblingDirectory(absolutePath) {
  const parsed = path.parse(absolutePath)
  const siblingDirectoryPath = path.join(parsed.dir, parsed.name)
  try {
    const stats = await fs.stat(siblingDirectoryPath)
    return stats.isDirectory()
  } catch {
    return false
  }
}

function shouldCheckLineBudget(relativePath, extension) {
  if (!SOURCE_EXTENSIONS.has(extension)) return false
  if (isComponentFile(relativePath)) return true
  if (isRoutePrivateComponent(relativePath)) return true
  return false
}

function shouldCheckSourceLineBudget(relativePath, extension) {
  if (!SOURCE_EXTENSIONS.has(extension)) return false
  return relativePath.startsWith("src/")
}

async function main() {
  const errors = []
  const warnings = []

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

  for (const absolutePath of files) {
    const relativePath = toRepoRelative(absolutePath)
    const extension = path.extname(relativePath)

    if (shouldValidateNaming(relativePath, extension)) {
      const namingError = validateKebabCaseFilename(relativePath)
      if (namingError) errors.push(namingError)
    }

    if (TEMPORARY_NAMING_PATTERN.test(relativePath) && !TEMPORARY_NAMING_ALLOWLIST.has(relativePath)) {
      errors.push(`Avoid temporary naming in active source paths: ${relativePath}`)
    }

    if (SOURCE_EXTENSIONS.has(extension)) {
      const hasSiblingDirectory = await hasSameNameSiblingDirectory(absolutePath)
      if (hasSiblingDirectory && !SHIM_FILE_ALLOWLIST.has(relativePath)) {
        const sourceText = await fs.readFile(absolutePath, "utf8")
        if (isPureReexportShim(relativePath, sourceText, extension)) {
          errors.push(
            `Avoid same-name shim file for pure re-exports: ${relativePath}. Use '${path.parse(relativePath).name}/index.ts' instead.`,
          )
        }
      }
    }

    const shouldCheckComponentBudget = shouldCheckLineBudget(relativePath, extension)
    const shouldCheckSourceBudget = shouldCheckSourceLineBudget(relativePath, extension)

    if (shouldCheckComponentBudget || shouldCheckSourceBudget) {
      const lines = await countLines(absolutePath)

      if (lines > COMPONENT_LINE_BUDGET && !COMPONENT_LINE_BUDGET_ALLOWLIST.has(relativePath)) {
        if (shouldCheckComponentBudget) {
          errors.push(
            `File exceeds component line budget (${COMPONENT_LINE_BUDGET}): ${relativePath} (${lines} lines)`,
          )
        }
      } else if (
        shouldCheckComponentBudget &&
        lines > Math.floor(COMPONENT_LINE_BUDGET * LINE_BUDGET_WARNING_THRESHOLD)
      ) {
        warnings.push(`Approaching component line budget: ${relativePath} (${lines} lines)`)
      }

      if (lines > SOURCE_LINE_BUDGET && !SOURCE_LINE_BUDGET_ALLOWLIST.has(relativePath)) {
        if (shouldCheckSourceBudget) {
          errors.push(
            `File exceeds source line budget (${SOURCE_LINE_BUDGET}): ${relativePath} (${lines} lines)`,
          )
        }
      } else if (
        shouldCheckSourceBudget &&
        lines > Math.floor(SOURCE_LINE_BUDGET * LINE_BUDGET_WARNING_THRESHOLD)
      ) {
        warnings.push(`Approaching source line budget: ${relativePath} (${lines} lines)`)
      }
    }
  }

  if (warnings.length > 0) {
    console.log("Structure warnings:")
    for (const warning of warnings) {
      console.log(`- ${warning}`)
    }
  }

  if (errors.length > 0) {
    console.error("Structure convention check failed:")
    for (const error of errors) {
      console.error(`- ${error}`)
    }
    process.exit(1)
  }

  console.log("Structure conventions check passed.")
}

main().catch((error) => {
  console.error("Unable to run structure convention check", error)
  process.exit(1)
})
