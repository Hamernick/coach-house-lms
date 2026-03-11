import { describe, expect, it } from "vitest"

import { resolveSupabaseProjectRef } from "@/lib/supabase/project-ref"

describe("resolveSupabaseProjectRef", () => {
  it("extracts the project ref from a hosted Supabase URL", () => {
    expect(resolveSupabaseProjectRef("https://abc123.supabase.co")).toBe("abc123")
  })

  it("fails closed for empty or invalid values", () => {
    expect(resolveSupabaseProjectRef("")).toBeNull()
    expect(resolveSupabaseProjectRef("not-a-url")).toBeNull()
    expect(resolveSupabaseProjectRef(null)).toBeNull()
  })
})
