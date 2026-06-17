#!/usr/bin/env node

const EXPECTED_PACKAGE_MANAGER = "pnpm@10.28.0"

const userAgent = process.env.npm_config_user_agent ?? ""
const execPath = process.env.npm_execpath ?? ""

const isPnpm =
  userAgent.includes("pnpm/") ||
  execPath.includes("/pnpm/") ||
  execPath.endsWith("/pnpm.cjs")

if (isPnpm) {
  process.exit(0)
}

console.error(`
This repo installs dependencies with ${EXPECTED_PACKAGE_MANAGER}.

Use:
  corepack enable
  pnpm install
  pnpm dev

Normal script aliases such as \`npm run dev\` are allowed, but npm/yarn installs
are blocked so the repo keeps one lockfile and the npm supply-chain checks stay
reliable.
`)

process.exit(1)
