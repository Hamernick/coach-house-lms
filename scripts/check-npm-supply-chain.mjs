#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs"

const FILES_TO_SCAN = [
  "package.json",
  "pnpm-lock.yaml",
  "package-lock.json",
  "npm-shrinkwrap.json",
  "yarn.lock",
]

const FORBIDDEN_LOCKFILES = ["package-lock.json", "npm-shrinkwrap.json", "yarn.lock"]

const AFFECTED_TANSTACK_VERSIONS = new Map([
  ["@tanstack/arktype-adapter", ["1.166.12", "1.166.15"]],
  ["@tanstack/eslint-plugin-router", ["1.161.9", "1.161.12"]],
  ["@tanstack/eslint-plugin-start", ["0.0.4", "0.0.7"]],
  ["@tanstack/history", ["1.161.9", "1.161.12"]],
  ["@tanstack/nitro-v2-vite-plugin", ["1.154.12", "1.154.15"]],
  ["@tanstack/react-router", ["1.169.5", "1.169.8"]],
  ["@tanstack/react-router-devtools", ["1.166.16", "1.166.19"]],
  ["@tanstack/react-router-ssr-query", ["1.166.15", "1.166.18"]],
  ["@tanstack/react-start", ["1.167.68", "1.167.71"]],
  ["@tanstack/react-start-client", ["1.166.51", "1.166.54"]],
  ["@tanstack/react-start-rsc", ["0.0.47", "0.0.50"]],
  ["@tanstack/react-start-server", ["1.166.55", "1.166.58"]],
  ["@tanstack/router-cli", ["1.166.46", "1.166.49"]],
  ["@tanstack/router-core", ["1.169.5", "1.169.8"]],
  ["@tanstack/router-devtools", ["1.166.16", "1.166.19"]],
  ["@tanstack/router-devtools-core", ["1.167.6", "1.167.9"]],
  ["@tanstack/router-generator", ["1.166.45", "1.166.48"]],
  ["@tanstack/router-plugin", ["1.167.38", "1.167.41"]],
  ["@tanstack/router-ssr-query-core", ["1.168.3", "1.168.6"]],
  ["@tanstack/router-utils", ["1.161.11", "1.161.14"]],
  ["@tanstack/router-vite-plugin", ["1.166.53", "1.166.56"]],
  ["@tanstack/solid-router", ["1.169.5", "1.169.8"]],
  ["@tanstack/solid-router-devtools", ["1.166.16", "1.166.19"]],
  ["@tanstack/solid-router-ssr-query", ["1.166.15", "1.166.18"]],
  ["@tanstack/solid-start", ["1.167.65", "1.167.68"]],
  ["@tanstack/solid-start-client", ["1.166.50", "1.166.53"]],
  ["@tanstack/solid-start-server", ["1.166.54", "1.166.57"]],
  ["@tanstack/start-client-core", ["1.168.5", "1.168.8"]],
  ["@tanstack/start-fn-stubs", ["1.161.9", "1.161.12"]],
  ["@tanstack/start-plugin-core", ["1.169.23", "1.169.26"]],
  ["@tanstack/start-server-core", ["1.167.33", "1.167.36"]],
  ["@tanstack/start-static-server-functions", ["1.166.44", "1.166.47"]],
  ["@tanstack/start-storage-context", ["1.166.38", "1.166.41"]],
  ["@tanstack/valibot-adapter", ["1.166.12", "1.166.15"]],
  ["@tanstack/virtual-file-routes", ["1.161.10", "1.161.13"]],
  ["@tanstack/vue-router", ["1.169.5", "1.169.8"]],
  ["@tanstack/vue-router-devtools", ["1.166.16", "1.166.19"]],
  ["@tanstack/vue-router-ssr-query", ["1.166.15", "1.166.18"]],
  ["@tanstack/vue-start", ["1.167.61", "1.167.64"]],
  ["@tanstack/vue-start-client", ["1.166.46", "1.166.49"]],
  ["@tanstack/vue-start-server", ["1.166.50", "1.166.53"]],
  ["@tanstack/zod-adapter", ["1.166.12", "1.166.15"]],
])

const SHAI_HULUD_IOCS = [
  "@tanstack/setup",
  "github:tanstack/router#79ac49eedf774dd4b0cfa308722bc463cfe5885c",
  "79ac49eedf774dd4b0cfa308722bc463cfe5885c",
  "router_init.js",
  "tanstack_runner.js",
  "filev2.getsession.org",
  "seed1.getsession.org",
  "seed2.getsession.org",
  "seed3.getsession.org",
  "litter.catbox.moe",
  "gh-token-monitor",
  "shai-hulud",
]

const BROADER_CAMPAIGN_PACKAGE_MARKERS = [
  "@mistralai/mistralai",
  "@mistralai/mistralai-azure",
  "@mistralai/mistralai-gcp",
  "@opensearch-project/opensearch",
  "@uipath/",
  "@squawk/",
  "intercom-client",
]

function readOptional(path) {
  if (!existsSync(path)) return null
  return readFileSync(path, "utf8")
}

function packageVersionPatterns(packageName, version) {
  const encodedName = packageName.replace("/", "+")

  return [
    `${packageName}@${version}`,
    `${encodedName}@${version}`,
    `"node_modules/${packageName}":`,
    `${packageName}/-/${packageName.split("/").pop()}-${version}.tgz`,
  ]
}

function packageLockMatches(packageName, version, text) {
  const packagePath = `node_modules/${packageName}`

  try {
    const lockfile = JSON.parse(text)
    return lockfile.packages?.[packagePath]?.version === version
  } catch {
    return false
  }
}

const scannedFiles = new Map()
const findings = []

for (const file of FILES_TO_SCAN) {
  const text = readOptional(file)
  if (text) scannedFiles.set(file, text)
}

for (const file of FORBIDDEN_LOCKFILES) {
  if (scannedFiles.has(file)) {
    findings.push(`${file}: remove this lockfile and use pnpm-lock.yaml`)
  }
}

const packageJsonText = scannedFiles.get("package.json")
if (packageJsonText) {
  try {
    const packageJson = JSON.parse(packageJsonText)
    if (packageJson.packageManager !== "pnpm@10.28.0") {
      findings.push('package.json: expected "packageManager": "pnpm@10.28.0"')
    }
    if (packageJson.scripts?.preinstall !== "node scripts/enforce-package-manager.mjs") {
      findings.push(
        'package.json: expected preinstall guard "node scripts/enforce-package-manager.mjs"'
      )
    }
  } catch {
    findings.push("package.json: could not parse JSON")
  }
}

for (const [file, text] of scannedFiles) {
  for (const ioc of SHAI_HULUD_IOCS) {
    if (text.includes(ioc)) {
      findings.push(`${file}: contains Shai-Hulud IOC "${ioc}"`)
    }
  }

  for (const marker of BROADER_CAMPAIGN_PACKAGE_MARKERS) {
    if (text.includes(marker)) {
      findings.push(`${file}: contains broader campaign package marker "${marker}"`)
    }
  }

  for (const [packageName, versions] of AFFECTED_TANSTACK_VERSIONS) {
    for (const version of versions) {
      const matchesText = packageVersionPatterns(packageName, version).some(
        (pattern) => text.includes(pattern)
      )
      const matchesPackageLock =
        file.endsWith("package-lock.json") &&
        packageLockMatches(packageName, version, text)

      if (matchesText || matchesPackageLock) {
        findings.push(
          `${file}: contains affected TanStack package ${packageName}@${version}`
        )
      }
    }
  }
}

if (findings.length > 0) {
  console.error("npm supply-chain check failed:")
  for (const finding of findings) console.error(`- ${finding}`)
  process.exit(1)
}

console.log(
  `npm supply-chain check passed (${[...scannedFiles.keys()].join(", ")})`
)
