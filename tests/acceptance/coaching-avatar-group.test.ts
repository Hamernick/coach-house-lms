import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("coaching avatar group", () => {
  it("uses Frank's avatar instead of the available coach placeholder", () => {
    const source = readSource(
      "src/components/coaching/coaching-avatar-group.tsx"
    )

    expect(source).toContain('id: "frank"')
    expect(source).toContain('name: "Frank"')
    expect(source).toContain(
      "https://vswzhuwjtgzrkxknrmxu.supabase.co/storage/v1/object/public/avatars/Frank.PNG"
    )
    expect(source).not.toContain('id: "placeholder"')
    expect(source).not.toContain("Coach slot available")
  })
})
