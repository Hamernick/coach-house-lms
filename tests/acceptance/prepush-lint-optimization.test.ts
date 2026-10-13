import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import { classifyLintPushFiles } from "../../scripts/lint-push-range.mjs"

describe("pre-push lint optimization", () => {
  it("skips lint when a push changes only non-lintable files", () => {
    expect(
      classifyLintPushFiles([
        "docs/runlog/2026-08.md",
        "supabase/migrations/20260801190000_example.sql",
      ])
    ).toEqual({
      mode: "skip",
      reason: "the push contains no JavaScript or TypeScript changes",
      files: [],
    })
  })

  it("lints only unique changed JavaScript and TypeScript files", () => {
    expect(
      classifyLintPushFiles([
        "./src/lib/example.ts",
        "src/lib/example.ts",
        "scripts/example.mjs",
        "docs/example.md",
      ])
    ).toEqual({
      mode: "changed",
      reason: "2 changed lintable file(s)",
      files: ["scripts/example.mjs", "src/lib/example.ts"],
    })
  })

  it.each([
    "eslint.config.mjs",
    "package.json",
    "pnpm-lock.yaml",
    "scripts/lint-push-range.mjs",
    "tsconfig.json",
    "tsconfig.snapshots.json",
  ])("falls back to full lint when %s changes", (file) => {
    expect(classifyLintPushFiles([file])).toMatchObject({
      mode: "full",
      files: [],
    })
  })

  it("keeps full cached lint in CI and scopes only the pre-push gate", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"))
    const lint = packageJson.scripts.lint as string
    const prepush = packageJson.scripts["check:prepush"] as string
    const quality = packageJson.scripts["check:quality"] as string

    expect(lint).toContain("--cache-strategy content")
    expect(lint).not.toContain("--concurrency")
    expect(prepush).toContain("pnpm lint:push")
    expect(prepush).not.toContain("pnpm lint &&")
    expect(quality).toContain("pnpm lint")
    expect(quality).not.toContain("pnpm lint:push")
  })

  it("passes the pushed remote name into the hook guard", () => {
    const hook = readFileSync(".githooks/pre-push", "utf8")
    const setup = readFileSync("scripts/setup-git-hooks.mjs", "utf8")

    expect(hook).toContain('PREPUSH_REMOTE="${1:-origin}" pnpm check:prepush')
    expect(setup).toContain(
      'PREPUSH_REMOTE="\\${1:-origin}" pnpm check:prepush'
    )
  })
})
