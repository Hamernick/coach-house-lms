import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("sign up form flow", () => {
  it("keeps the onboarding-path question out of the pre-confirmation form", () => {
    const source = readSource("src/components/auth/sign-up-form.tsx")

    expect(source).not.toContain("How will you use Coach House?")
    expect(source).not.toContain("JOURNEY_OPTIONS")
    expect(source).not.toContain("Builder accounts continue into pricing")
    expect(source).toContain(
      "const activeIntentFocus = lockedIntentFocus ?? defaultIntentFocus",
    )
  })
})
