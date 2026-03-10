#!/usr/bin/env node

import { execFileSync } from "node:child_process"
import { chmodSync, existsSync, mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"

const ROOT = process.cwd()
const HOOKS_DIR = path.join(ROOT, ".githooks")
const PRE_PUSH_PATH = path.join(HOOKS_DIR, "pre-push")

const PRE_PUSH_SCRIPT = `#!/usr/bin/env sh
set -eu

echo "[pre-push] Running structural quality subset..."
pnpm check:prepush
`

function ensureGitRepository() {
  try {
    execFileSync("git", ["rev-parse", "--is-inside-work-tree"], { stdio: "ignore" })
    return true
  } catch {
    return false
  }
}

function ensurePrePushHook() {
  mkdirSync(HOOKS_DIR, { recursive: true })
  if (!existsSync(PRE_PUSH_PATH)) {
    writeFileSync(PRE_PUSH_PATH, PRE_PUSH_SCRIPT, "utf8")
  }
  chmodSync(PRE_PUSH_PATH, 0o755)
}

function configureHooksPath() {
  execFileSync("git", ["config", "core.hooksPath", ".githooks"], { stdio: "inherit" })
}

function main() {
  if (!ensureGitRepository()) {
    console.error("Not inside a git repository; cannot configure hooks.")
    process.exit(1)
  }

  ensurePrePushHook()
  configureHooksPath()
  console.log("Git hooks configured: core.hooksPath=.githooks")
  console.log("Pre-push guard: pnpm check:prepush")
}

main()
