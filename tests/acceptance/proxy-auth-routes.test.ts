import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

describe("proxy auth route redirects", () => {
  it("sends already-authenticated auth routes through the post-auth landing guard", () => {
    const source = readFileSync(join(ROOT, "src/proxy.ts"), "utf8")

    expect(source).toContain("DEFAULT_POST_AUTH_REDIRECT")
    expect(source).not.toContain('new URL("/projects"')
  })
})
