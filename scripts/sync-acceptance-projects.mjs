#!/usr/bin/env node

import { readFile, readdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import ts from "typescript"

const ROOT = process.cwd()
const ACCEPTANCE_DIRECTORY = path.join(ROOT, "tests/acceptance")
const MANIFEST_PATH = path.join(ACCEPTANCE_DIRECTORY, "projects.json")

export const ACCEPTANCE_PROJECT_NAMES = Object.freeze([
  "behavior",
  "contract",
  "cli",
  "integration",
])

const FULL_SETUP_MODULES = new Set([
  "server-only",
  "stripe",
  "next/cache",
  "next/headers",
  "next/navigation",
  "@supabase/ssr",
  "@supabase/supabase-js",
])

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(directory, entry.name)
      return entry.isDirectory() ? listFiles(absolutePath) : [absolutePath]
    })
  )
  return nested.flat()
}

function isApplicationModule(specifier) {
  return (
    specifier.startsWith("@/") ||
    /^(?:\.\.\/)+src\//.test(specifier) ||
    specifier.includes("/src/")
  )
}

function inspectAcceptanceSource(source) {
  const sourceFile = ts.createSourceFile(
    "acceptance.test.ts",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  )
  const imports = []
  let readsRepositorySource = false

  function visit(node) {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      imports.push(node.moduleSpecifier.text)
    }

    if (ts.isCallExpression(node)) {
      const [argument] = node.arguments
      if (
        argument &&
        ts.isStringLiteral(argument) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) &&
            node.expression.text === "require"))
      ) {
        imports.push(argument.text)
      }

      const callName = ts.isIdentifier(node.expression)
        ? node.expression.text
        : ts.isPropertyAccessExpression(node.expression)
          ? node.expression.name.text
          : null
      if (callName === "readFile" || callName === "readFileSync") {
        readsRepositorySource = true
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return { imports, readsRepositorySource }
}

export function classifyAcceptanceSource(source) {
  const { imports, readsRepositorySource } = inspectAcceptanceSource(source)
  const applicationImports = new Set(imports.filter(isApplicationModule))
  const requiresFullSetup = imports.some((specifier) =>
    FULL_SETUP_MODULES.has(specifier)
  )

  if (
    imports.some(
      (specifier) =>
        specifier === "node:child_process" || specifier === "child_process"
    )
  ) {
    return "cli"
  }
  if (
    readsRepositorySource &&
    applicationImports.size === 0 &&
    !requiresFullSetup
  ) {
    return "contract"
  }
  if (applicationImports.size >= 2) return "integration"
  return "behavior"
}

export async function buildAcceptanceProjectManifest({
  acceptanceDirectory = ACCEPTANCE_DIRECTORY,
  root = ROOT,
} = {}) {
  const files = (await listFiles(acceptanceDirectory))
    .filter((file) => file.endsWith(".test.ts"))
    .sort()
  const projects = Object.fromEntries(
    ACCEPTANCE_PROJECT_NAMES.map((name) => [name, []])
  )

  await Promise.all(
    files.map(async (file) => {
      const source = await readFile(file, "utf8")
      const projectName = classifyAcceptanceSource(source)
      projects[projectName].push(
        path.relative(root, file).split(path.sep).join("/")
      )
    })
  )

  for (const projectName of ACCEPTANCE_PROJECT_NAMES) {
    projects[projectName].sort()
  }

  return {
    projects,
    schemaVersion: 1,
  }
}

export function compareAcceptanceProjectManifests(actual, expected) {
  const errors = []

  if (actual?.schemaVersion !== expected.schemaVersion) {
    errors.push(
      `schemaVersion must be ${expected.schemaVersion}, received ${String(actual?.schemaVersion)}`
    )
  }

  const actualProjects = actual?.projects ?? {}
  const unexpectedProjects = Object.keys(actualProjects).filter(
    (name) => !ACCEPTANCE_PROJECT_NAMES.includes(name)
  )
  if (unexpectedProjects.length > 0) {
    errors.push(`unexpected projects: ${unexpectedProjects.sort().join(", ")}`)
  }

  const seenFiles = new Map()
  for (const projectName of ACCEPTANCE_PROJECT_NAMES) {
    const actualFiles = actualProjects[projectName]
    const expectedFiles = expected.projects[projectName]

    if (!Array.isArray(actualFiles)) {
      errors.push(`missing project: ${projectName}`)
      continue
    }

    for (const file of actualFiles) {
      const priorProject = seenFiles.get(file)
      if (priorProject) {
        errors.push(
          `duplicate file: ${file} appears in ${priorProject} and ${projectName}`
        )
      } else {
        seenFiles.set(file, projectName)
      }
    }

    if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) {
      const actualSet = new Set(actualFiles)
      const expectedSet = new Set(expectedFiles)
      const missing = expectedFiles.filter((file) => !actualSet.has(file))
      const extra = actualFiles.filter((file) => !expectedSet.has(file))
      if (missing.length > 0) {
        errors.push(`${projectName} missing: ${missing.join(", ")}`)
      }
      if (extra.length > 0) {
        errors.push(`${projectName} unexpected: ${extra.join(", ")}`)
      }
      if (missing.length === 0 && extra.length === 0) {
        errors.push(`${projectName} entries are not sorted`)
      }
    }
  }

  return errors
}

function formatProjectCounts(manifest) {
  const counts = ACCEPTANCE_PROJECT_NAMES.map(
    (name) => `${name}=${manifest.projects[name].length}`
  )
  const total = ACCEPTANCE_PROJECT_NAMES.reduce(
    (sum, name) => sum + manifest.projects[name].length,
    0
  )
  return `${counts.join(" ")} total=${total}`
}

async function checkManifest() {
  const [actualSource, expected] = await Promise.all([
    readFile(MANIFEST_PATH, "utf8"),
    buildAcceptanceProjectManifest(),
  ])
  const actual = JSON.parse(actualSource)
  const errors = compareAcceptanceProjectManifests(actual, expected)
  if (errors.length > 0) {
    throw new Error(
      `Acceptance project manifest is stale:\n- ${errors.join("\n- ")}\nRun pnpm test:acceptance:manifest:update and review the change.`
    )
  }
  console.log(`[acceptance-projects] ${formatProjectCounts(actual)}`)
}

async function writeManifest() {
  const manifest = await buildAcceptanceProjectManifest()
  await writeFile(
    MANIFEST_PATH,
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  )
  console.log(`[acceptance-projects] wrote ${formatProjectCounts(manifest)}`)
}

async function main() {
  const command = process.argv[2] ?? "--check"
  if (command === "--check") return checkManifest()
  if (command === "--write") return writeManifest()
  throw new Error(`Unknown command '${command}'. Expected --check or --write.`)
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : null
if (entryPath === fileURLToPath(import.meta.url)) {
  try {
    await main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
