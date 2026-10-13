import { beforeEach, describe, expect, it, vi } from "vitest"
import { projectPublicPeople } from "@/features/public-profiles/lib/public-directory"

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }))
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createClient,
}))
import { fetchPublicPeopleDirectory } from "@/lib/queries/public-people"

const person = {
  profile_id: "person-1",
  display_name: "Published Person",
  headline: "Community organizer",
  location_label: "Chicago",
  avatar_url: "https://example.org/avatar.png",
  is_public: true,
}
const handle = {
  profile_id: "person-1",
  owner_type: "person",
  handle: "published-person",
}

function clientFor(
  people: unknown[],
  handles: unknown[],
  error: unknown = null
) {
  const peopleQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({ data: people, error }),
  }
  const handlesQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ data: handles, error: null }),
  }
  const from = vi.fn((table: string) => {
    if (table === "public_person_profiles") return peopleQuery
    if (table === "public_handles") return handlesQuery
    throw new Error(`Unexpected private table: ${table}`)
  })
  createClient.mockResolvedValue({ from })
  return { from, peopleQuery, handlesQuery }
}

describe("public people directory", () => {
  beforeEach(() => vi.clearAllMocks())

  it("projects only named, published people with a valid person handle", () => {
    const withPrivateFields = {
      ...person,
      email: "private@example.org",
      bio: "Not a directory field",
      show_saved_locations: true,
    }
    expect(
      projectPublicPeople(
        [
          withPrivateFields,
          { ...person, profile_id: "private", is_public: false },
          { ...person, profile_id: "orphan" },
          { ...person, profile_id: "organization-owner" },
        ],
        [
          handle,
          { ...handle, profile_id: "private", handle: "private-person" },
          {
            ...handle,
            profile_id: "organization-owner",
            owner_type: "organization",
          },
        ]
      )
    ).toEqual([
      {
        handle: "published-person",
        name: "Published Person",
        headline: "Community organizer",
        location: "Chicago",
        avatarUrl: "https://example.org/avatar.png",
        href: "/published-person",
      },
    ])
    expect(
      projectPublicPeople([person], [{ ...handle, handle: "documentation" }])
    ).toEqual([])
    expect(
      projectPublicPeople(
        [person],
        [{ ...handle, handle: "javascript:alert(1)" }]
      )
    ).toEqual([])
    expect(
      projectPublicPeople([{ ...person, display_name: " " }], [handle])
    ).toEqual([])
  })

  it("does not render unsafe avatar URLs or unvalidated profile paths", () => {
    for (const avatar_url of [
      "javascript:alert(1)",
      "data:image/svg+xml,<svg/>",
      "http://example.org/avatar.png",
      "not a URL",
    ]) {
      expect(
        projectPublicPeople([{ ...person, avatar_url }], [handle])[0].avatarUrl
      ).toBeNull()
    }
    expect(
      projectPublicPeople(
        [person],
        [{ ...handle, handle: "@Published-Person" }]
      )[0].href
    ).toBe("/published-person")
  })

  it("uses explicit publication filters, safe columns, and person-owned handles", async () => {
    const calls = clientFor([person], [handle])
    expect(await fetchPublicPeopleDirectory()).toEqual({
      status: "ready",
      people: projectPublicPeople([person], [handle]),
      hasMore: false,
      page: 1,
    })
    expect(calls.peopleQuery.eq).toHaveBeenCalledWith("is_public", true)
    expect(calls.peopleQuery.select).toHaveBeenCalledWith(
      "profile_id, display_name, headline, location_label, avatar_url, is_public"
    )
    expect(calls.handlesQuery.eq).toHaveBeenCalledWith("owner_type", "person")
    expect(calls.handlesQuery.in).toHaveBeenCalledWith("profile_id", [
      "person-1",
    ])
  })

  it("paginates deterministically and does not expose the lookahead row", async () => {
    const rows = Array.from({ length: 25 }, (_, i) => ({
      ...person,
      profile_id: `person-${i}`,
    }))
    const handles = rows.map((row, i) => ({
      ...handle,
      profile_id: row.profile_id,
      handle: `person-${i}`,
    }))
    const calls = clientFor(rows, handles)
    const result = await fetchPublicPeopleDirectory(2)
    expect(calls.peopleQuery.range).toHaveBeenCalledWith(24, 48)
    expect(result.people).toHaveLength(24)
    expect(result.hasMore).toBe(true)
    expect(result.people.some((entry) => entry.handle === "person-24")).toBe(
      false
    )
    expect(calls.peopleQuery.order.mock.calls).toEqual([
      ["display_name"],
      ["profile_id"],
    ])
  })

  it("distinguishes no published members from an unavailable service", async () => {
    const calls = clientFor([], [])
    expect(await fetchPublicPeopleDirectory(NaN)).toEqual({
      status: "ready",
      people: [],
      hasMore: false,
      page: 1,
    })
    expect(calls.from).toHaveBeenCalledTimes(1)
    clientFor([], [], { message: "private internal error" })
    expect(await fetchPublicPeopleDirectory()).toEqual({
      status: "unavailable",
      people: [],
      hasMore: false,
      page: 1,
    })
    createClient.mockRejectedValue(new Error("Unavailable"))
    expect((await fetchPublicPeopleDirectory()).status).toBe("unavailable")
  })
})
