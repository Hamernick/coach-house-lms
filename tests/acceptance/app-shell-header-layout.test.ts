import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("app shell header layout", () => {
  it("keeps header actions independent from right rail open state", () => {
    const headerSource = readSource(
      "src/components/app-shell/components/app-shell-header.tsx"
    )
    const rightRailSource = readSource(
      "src/components/app-shell/components/shell-right-rail.tsx"
    )

    expect(headerSource).toContain('id="site-header-actions-right"')
    expect(headerSource).toContain("pr-[var(--shell-content-pad)]")
    expect(headerSource).not.toContain("headerRightPadding")
    expect(headerSource).not.toContain("--shell-right-rail")
    expect(headerSource).not.toContain(
      "pr-[calc(var(--shell-content-pad)+var(--shell-right-rail))]"
    )
    expect(rightRailSource).toContain(
      'open ? "w-[var(--shell-right-rail-width)]" : "w-0 pointer-events-none"'
    )
  })
})
