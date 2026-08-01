#!/usr/bin/env node

import { spawnSync } from "node:child_process"
import process from "node:process"
import { pathToFileURL } from "node:url"

const ESLINT_CACHE_ARGS = [
  "--cache",
  "--cache-strategy",
  "content",
  "--cache-location",
  "node_modules/.cache/eslint/.eslintcache",
]

const FULL_LINT_FILES = new Set([
  ".eslintignore",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "scripts/lint-push-range.mjs",
])

const LINTABLE_FILE_PATTERN = /\.(?:[cm]?js|jsx|[cm]?ts|tsx)$/i
const ESLINT_CONFIG_PATTERN = /(^|\/)eslint\.config\.[^/]+$/i
const TYPESCRIPT_CONFIG_PATTERN = /(^|\/)tsconfig(?:\.[^/]+)?\.json$/i

function normalizePath(file) {
  return file.replaceAll("\\", "/").replace(/^\.\//, "")
}

function requiresFullLint(file) {
  return (
    FULL_LINT_FILES.has(file) ||
    ESLINT_CONFIG_PATTERN.test(file) ||
    TYPESCRIPT_CONFIG_PATTERN.test(file)
  )
}

export function classifyLintPushFiles(files) {
  const normalizedFiles = Array.from(
    new Set(files.map(normalizePath).filter(Boolean))
  ).sort()
  const fullLintTrigger = normalizedFiles.find(requiresFullLint)

  if (fullLintTrigger) {
    return {
      mode: "full",
      reason: `${fullLintTrigger} can change lint results repository-wide`,
      files: [],
    }
  }

  const lintableFiles = normalizedFiles.filter((file) =>
    LINTABLE_FILE_PATTERN.test(file)
  )
  if (lintableFiles.length === 0) {
    return {
      mode: "skip",
      reason: "the push contains no JavaScript or TypeScript changes",
      files: [],
    }
  }

  return {
    mode: "changed",
    reason: `${lintableFiles.length} changed lintable file(s)`,
    files: lintableFiles,
  }
}

function runGit(args, cwd) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
    stdio: ["ignore", "pipe", "ignore"],
  })
  if (result.status !== 0 || result.error) return null
  return result.stdout.trim()
}

function refExists(ref, cwd) {
  return (
    runGit(["rev-parse", "--verify", "--quiet", `${ref}^{commit}`], cwd) !==
    null
  )
}

export function resolveLintBaseRef({
  cwd = process.cwd(),
  remote = process.env.PREPUSH_REMOTE?.trim() || "origin",
  requestedBase = process.env.PREPUSH_BASE_REF?.trim() || "",
} = {}) {
  const candidates = []
  if (requestedBase) candidates.push(requestedBase)

  const remoteHead = runGit(
    ["symbolic-ref", "--quiet", `refs/remotes/${remote}/HEAD`],
    cwd
  )
  if (remoteHead?.startsWith("refs/remotes/")) {
    candidates.push(remoteHead.slice("refs/remotes/".length))
  }

  candidates.push(`${remote}/main`, "origin/main", "main")
  return (
    Array.from(new Set(candidates)).find((ref) => refExists(ref, cwd)) ?? null
  )
}

export function collectPushChangedFiles({ cwd = process.cwd(), baseRef } = {}) {
  if (!baseRef) return null
  const mergeBase = runGit(["merge-base", "HEAD", baseRef], cwd)
  if (!mergeBase) return null

  const changed = runGit(
    ["diff", "--name-only", "--diff-filter=ACMR", "-z", mergeBase, "HEAD"],
    cwd
  )
  if (changed === null) return null
  return changed.split("\0").filter(Boolean)
}

function runPnpm(args, cwd) {
  const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm"
  const result = spawnSync(command, args, { cwd, stdio: "inherit" })
  if (result.error) {
    console.error(`[lint:push] ${result.error.message}`)
    return 1
  }
  return result.status ?? 1
}

function runFullLint(cwd, reason) {
  console.log(`[lint:push] Running full lint because ${reason}.`)
  return runPnpm(["lint"], cwd)
}

export function runPushLint({ cwd = process.cwd() } = {}) {
  const baseRef = resolveLintBaseRef({ cwd })
  if (!baseRef) {
    return runFullLint(cwd, "no trustworthy base ref was available")
  }

  const changedFiles = collectPushChangedFiles({ cwd, baseRef })
  if (!changedFiles) {
    return runFullLint(
      cwd,
      `the changed range from ${baseRef} could not be resolved`
    )
  }

  const plan = classifyLintPushFiles(changedFiles)
  if (plan.mode === "full") return runFullLint(cwd, plan.reason)
  if (plan.mode === "skip") {
    console.log(
      `[lint:push] Skipping ESLint: ${plan.reason} against ${baseRef}.`
    )
    return 0
  }

  console.log(
    `[lint:push] Linting ${plan.files.length} changed file(s) against ${baseRef}.`
  )
  return runPnpm(
    [
      "exec",
      "eslint",
      ...ESLINT_CACHE_ARGS,
      "--no-warn-ignored",
      "--",
      ...plan.files,
    ],
    cwd
  )
}

const isEntrypoint =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(process.argv[1]).href

if (isEntrypoint) {
  process.exitCode = runPushLint()
}
