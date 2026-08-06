import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

describe("workspace accelerator progress persistence", () => {
  it("publishes progress only after an explicit accelerator interaction", () => {
    const source = readFileSync(
      join(
        ROOT,
        "src/features/workspace-accelerator-card/hooks/use-workspace-accelerator-card-controller.ts"
      ),
      "utf8"
    )
    const firstUserAction = source.indexOf("const goPrevious = useCallback")

    expect(firstUserAction).toBeGreaterThan(0)
    expect(source.slice(0, firstUserAction)).not.toContain(
      "pendingUserProgressChangeRef.current = true"
    )
    expect(source).toContain(
      "const pendingUserProgressChangeRef = useRef(false)"
    )
    expect(source).toContain(
      "lastProgressSignatureRef.current = progressSignature\n    if (!pendingUserProgressChangeRef.current) return"
    )
    expect(
      source.match(/pendingUserProgressChangeRef\.current = true/g)
    ).toHaveLength(4)
  })
})
