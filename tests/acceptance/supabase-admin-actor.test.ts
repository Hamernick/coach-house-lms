import { afterEach, expect, it, vi } from "vitest"

vi.mock("@/lib/env", () => ({ env: {
  NEXT_PUBLIC_SUPABASE_URL: "https://supabase.test",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
} }))

import { createSupabaseAdminClient } from "@/lib/supabase/admin"

afterEach(() => vi.unstubAllGlobals())

it("keeps verified actor headers isolated to each admin client's database request", async () => {
  const headers: Headers[] = []
  vi.stubGlobal("fetch", vi.fn(async (_input: unknown, init?: RequestInit) => {
    headers.push(new Headers(init?.headers))
    return new Response("[]", { headers: { "Content-Type": "application/json" } })
  }))
  const first = createSupabaseAdminClient({ actorId: "a0000000-0000-4000-8000-000000000001" })
  const second = createSupabaseAdminClient({ actorId: "b0000000-0000-4000-8000-000000000002" })
  const system = createSupabaseAdminClient()
  for (const client of [first, second, system, first]) {
    await client.from("organizations").select("user_id")
  }
  expect(headers.map((value) => value.get("x-coach-house-actor-id"))).toEqual([
    "a0000000-0000-4000-8000-000000000001",
    "b0000000-0000-4000-8000-000000000002",
    null,
    "a0000000-0000-4000-8000-000000000001",
  ])
  expect(headers.every((value) => value.get("authorization") === "Bearer test-service-key")).toBe(true)
})
