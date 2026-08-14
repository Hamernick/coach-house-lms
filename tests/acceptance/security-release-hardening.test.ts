import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { getSafeRedirectPath } from "@/lib/auth/redirects"

describe("release security hardening", () => {
  it("keeps authentication redirects on the application origin", () => {
    expect(getSafeRedirectPath("/workspace?drawer=finance#records")).toBe(
      "/workspace?drawer=finance#records"
    )
    expect(getSafeRedirectPath("/\\evil.example")).toBeUndefined()
    expect(getSafeRedirectPath("/%5Cevil.example")).toBeUndefined()
    expect(getSafeRedirectPath("/%255Cevil.example")).toBeUndefined()
    expect(getSafeRedirectPath("/%2F%2Fevil.example")).toBeUndefined()
    expect(getSafeRedirectPath("//evil.example")).toBeUndefined()
    expect(getSafeRedirectPath("/workspace\n/evil")).toBeUndefined()
  })

  it("requires platform administration for every legacy class route", () => {
    const collectionRoute = readFileSync("src/app/api/classes/route.ts", "utf8")
    const itemRoute = readFileSync("src/app/api/classes/[id]/route.ts", "utf8")

    expect(collectionRoute.match(/await requireAdmin\(\)/g)).toHaveLength(2)
    expect(itemRoute.match(/await requireAdmin\(\)/g)).toHaveLength(3)
  })

  it("keeps public tester provisioning unavailable", () => {
    const page = readFileSync("src/app/(auth)/tester/sign-up/page.tsx", "utf8")
    const action = readFileSync(
      "src/app/(auth)/tester/sign-up/actions.ts",
      "utf8"
    )

    expect(page).toContain("notFound()")
    expect(action).not.toContain("auth.admin")
    expect(action).not.toContain('from("profiles")')
  })
})
