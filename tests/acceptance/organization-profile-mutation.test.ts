import { describe, expect, it, vi } from "vitest"

import {
  mutateOrganizationProfile,
  ORGANIZATION_PROFILE_CONFLICT_ERROR,
} from "@/lib/organization/profile-mutation"

function buildSupabaseStub({
  profiles,
  writes,
}: {
  profiles: Array<{ profile: Record<string, unknown>; updated_at: string }>
  writes: Array<{ updated_at: string } | null>
}) {
  let readIndex = 0
  let writeIndex = 0
  const readMaybeSingle = vi.fn(async () => {
    const data = profiles[readIndex] ?? profiles.at(-1) ?? null
    readIndex += 1
    return { data, error: null }
  })
  const writeMaybeSingle = vi.fn(async () => {
    const data = writes[writeIndex] ?? null
    writeIndex += 1
    return { data, error: null }
  })
  const readEq = vi.fn(() => ({ maybeSingle: readMaybeSingle }))
  const readSelect = vi.fn(() => ({ eq: readEq }))
  const writeSelect = vi.fn(() => ({ maybeSingle: writeMaybeSingle }))
  const writeEq = vi.fn(() => ({ eq: writeEq, select: writeSelect }))
  const update = vi.fn(() => ({ eq: writeEq }))
  const from = vi.fn(() => ({ select: readSelect, update }))

  return {
    supabase: { from } as never,
    calls: { from, update },
  }
}

describe("organization profile mutation", () => {
  it("retries against the newest profile after a stale revision", async () => {
    const { calls, supabase } = buildSupabaseStub({
      profiles: [
        { profile: { name: "Original" }, updated_at: "revision-1" },
        {
          profile: { name: "Concurrent", unrelated: true },
          updated_at: "revision-2",
        },
      ],
      writes: [null, { updated_at: "revision-3" }],
    })

    const result = await mutateOrganizationProfile({
      orgId: "org-1",
      supabase,
      mutate: (profile) => ({
        changed: true,
        nextProfile: { ...profile, documents: { bylaws: true } },
        value: null,
      }),
    })

    expect(result).toEqual({ ok: true, value: null })
    expect(calls.update).toHaveBeenCalledTimes(2)
    expect(calls.update).toHaveBeenLastCalledWith({
      profile: {
        name: "Concurrent",
        unrelated: true,
        documents: { bylaws: true },
      },
    })
  })

  it("returns a conflict without overwriting after bounded retries", async () => {
    const { supabase } = buildSupabaseStub({
      profiles: [
        { profile: {}, updated_at: "revision-1" },
        { profile: {}, updated_at: "revision-2" },
      ],
      writes: [null, null],
    })

    const result = await mutateOrganizationProfile({
      maxAttempts: 2,
      orgId: "org-1",
      supabase,
      mutate: (profile) => ({
        changed: true,
        nextProfile: { ...profile, policies: [] },
        value: null,
      }),
    })

    expect(result).toEqual({
      error: ORGANIZATION_PROFILE_CONFLICT_ERROR,
      status: 409,
    })
  })
})
