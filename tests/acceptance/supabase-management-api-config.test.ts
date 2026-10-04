import { afterEach, describe, expect, it, vi } from "vitest"

import { hasSupabaseManagementApiToken } from "@/lib/supabase/management-api-config"

afterEach(() => vi.unstubAllEnvs())

describe("supabase management api config", () => {
  it.each([undefined, "", "   "])("treats %s as missing configuration", (token) => {
    vi.stubEnv("SUPABASE_MANAGEMENT_API_TOKEN", token)
    expect(hasSupabaseManagementApiToken()).toBe(false)
  })

  it("recognizes a configured token for the platform tools page", () => {
    vi.stubEnv("SUPABASE_MANAGEMENT_API_TOKEN", "configured-token")
    expect(hasSupabaseManagementApiToken()).toBe(true)
  })
})
