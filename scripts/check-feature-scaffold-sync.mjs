#!/usr/bin/env node

import { execFile as execFileCb } from "node:child_process"
import { promises as fs } from "node:fs"
import path from "node:path"
import { promisify } from "node:util"

const execFile = promisify(execFileCb)

const ROOT = process.cwd()
const SMOKE_FEATURE_NAME = "scaffold-contract-smoke"
const FEATURE_DIR = path.join(ROOT, "src", "features", SMOKE_FEATURE_NAME)
const ACCEPTANCE_TEST_FILE = path.join(ROOT, "tests", "acceptance", `${SMOKE_FEATURE_NAME}.test.ts`)

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

async function runNodeScript(scriptPath, args = []) {
  const result = await execFile(process.execPath, [scriptPath, ...args], { cwd: ROOT })
  if (result.stdout?.trim().length > 0) {
    process.stdout.write(result.stdout)
  }
  if (result.stderr?.trim().length > 0) {
    process.stderr.write(result.stderr)
  }
}

async function removeIfPresent(targetPath) {
  if (!(await pathExists(targetPath))) return
  await fs.rm(targetPath, { recursive: true, force: true })
}

async function main() {
  const featureAlreadyExists = await pathExists(FEATURE_DIR)
  const acceptanceAlreadyExists = await pathExists(ACCEPTANCE_TEST_FILE)
  if (featureAlreadyExists || acceptanceAlreadyExists) {
    throw new Error(
      `Reserved smoke-test paths already exist. Remove '${path.relative(ROOT, FEATURE_DIR)}' and '${path.relative(ROOT, ACCEPTANCE_TEST_FILE)}'.`,
    )
  }

  try {
    await runNodeScript(path.join("scripts", "new-feature.mjs"), [SMOKE_FEATURE_NAME])

    const expectedPaths = [
      path.join(FEATURE_DIR, "README.md"),
      path.join(FEATURE_DIR, "index.ts"),
      path.join(FEATURE_DIR, "types.ts"),
      path.join(FEATURE_DIR, "components", "index.ts"),
      path.join(FEATURE_DIR, "lib", "index.ts"),
      path.join(FEATURE_DIR, "server", "actions.ts"),
      ACCEPTANCE_TEST_FILE,
    ]

    for (const expectedPath of expectedPaths) {
      if (!(await pathExists(expectedPath))) {
        throw new Error(`Scaffold output missing expected file: ${path.relative(ROOT, expectedPath)}`)
      }
    }

    await runNodeScript(path.join("scripts", "check-feature-contract.mjs"))
  } finally {
    await removeIfPresent(FEATURE_DIR)
    await removeIfPresent(ACCEPTANCE_TEST_FILE)
  }

  await runNodeScript(path.join("scripts", "check-feature-contract.mjs"))
  console.log("Feature scaffold sync check passed.")
}

main().catch((error) => {
  console.error("Feature scaffold sync check failed.")
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
