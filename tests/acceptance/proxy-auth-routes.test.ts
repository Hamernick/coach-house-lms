import { readFileSync } from "node:fs"
import { join } from "node:path"
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { createServerClient, getUser } = vi.hoisted(() => {
  const getUser = vi.fn().mockResolvedValue({ data: { user: null } })
  return {
    getUser,
    createServerClient: vi.fn(() => ({ auth: { getUser } })),
  }
})

vi.mock("@supabase/ssr", () => ({ createServerClient }))
vi.mock("@/lib/env", () => ({ env: {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
} }))
vi.mock("@/features/platform-access", () => ({ isCoachRestrictedPath: () => false }))

import { proxy } from "@/proxy"

describe("public documentation access", () => {
  beforeEach(() => vi.clearAllMocks())

  it.each(["/documentation", "/documentation/quickstart", "/documentation/search?q=grants"])(
    "serves %s without account lookups, including when session cookies exist",
    async (path) => {
      for (const cookie of ["", "sb-test-auth-token=existing-session"]) {
        const response = await proxy(new NextRequest(`https://coachhouse.app${path}`, {
          headers: { cookie },
        }))
        expect(response.status).toBe(200)
        expect(response.headers.get("location")).toBeNull()
      }
      expect(createServerClient).not.toHaveBeenCalled()
    }
  )

  it("keeps mutations and similarly named routes in the auth pipeline", async () => {
    await proxy(new NextRequest("https://coachhouse.app/documentation", { method: "POST" }))
    await proxy(new NextRequest("https://coachhouse.app/documentation-private"))
    expect(getUser).toHaveBeenCalledTimes(2)
  })

  it("still redirects anonymous workspace requests to login", async () => {
    const response = await proxy(new NextRequest("https://coachhouse.app/workspace"))
    expect(getUser).toHaveBeenCalledOnce()
    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toBe("https://coachhouse.app/login?redirect=%2Fworkspace")
  })
})

const ROOT = process.cwd()

describe("proxy auth route redirects", () => {
  it("sends already-authenticated auth routes through the post-auth landing guard", () => {
    const source = readFileSync(join(ROOT, "src/proxy.ts"), "utf8")

    expect(source).toContain("DEFAULT_POST_AUTH_REDIRECT")
    expect(source).not.toContain('new URL("/projects"')
  })
})
