import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { rpc, createClient } = vi.hoisted(() => ({
  rpc: vi.fn(),
  createClient: vi.fn(),
}))
vi.mock("@supabase/supabase-js", () => ({ createClient }))
vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://directory.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-only",
  },
}))

import { GET as search } from "@/app/api/public/nonprofits/search/route"
import { GET as detail } from "@/app/api/public/nonprofits/[ein]/route"

import { loadNonprofitDirectoryPage } from "@/features/find-resource-index/lib/nonprofit-directory-client"

afterEach(() => vi.restoreAllMocks())

const item = (ein: string) => ({
  ein,
  name: "Community nonprofit",
  city: null,
  state: null,
  postalCode: null,
  website: null,
  phone: null,
  description: null,
  websiteBasis: null,
  phoneBasis: null,
  websiteSourcePeriod: null,
  phoneSourcePeriod: null,
  descriptionSourcePeriod: null,
  operatingStatus: "unknown",
  listingType: "nonprofit_organization",
})
beforeEach(() => {
  vi.clearAllMocks()
  createClient.mockReturnValue({ rpc })
})

describe("bounded nonprofit organization search", () => {
  it("returns source identities without coordinates, service categories or contact fields", async () => {
    rpc.mockResolvedValue({ data: [item("012345678")], error: null })
    const response = await search(
      new Request(
        "https://coachhouse.app/api/public/nonprofits/search?q=community"
      )
    )
    expect(response.status).toBe(200)
    expect((await response.json()).items[0]).toMatchObject({
      ein: "012345678",
      website: null,
      listingType: "nonprofit_organization",
    })
    expect(createClient.mock.calls[0][1]).toBe("anon-only")
    expect(rpc).toHaveBeenCalledWith(
      "search_nonprofit_directory_v2",
      expect.objectContaining({ p_limit: 51 })
    )
  })
  it("binds keyset cursors to the query and state; never calculates a national total", async () => {
    rpc.mockResolvedValue({
      data: [item("012345678"), item("012345679")],
      error: null,
    })
    const first = await search(
      new Request(
        "https://coachhouse.app/api/public/nonprofits/search?q=community&state=IL&limit=1"
      )
    )
    const data = await first.json()
    expect(data.items).toHaveLength(1)
    expect(data.page.hasMore).toBe(true)
    expect(data.page).not.toHaveProperty("totalCount")
    const cursor = encodeURIComponent(data.page.nextCursor)
    rpc.mockResolvedValue({ data: [item("012345679")], error: null })
    await search(
      new Request(
        `https://coachhouse.app/api/public/nonprofits/search?q=community&state=IL&limit=1&cursor=${cursor}`
      )
    )
    expect(rpc).toHaveBeenLastCalledWith(
      "search_nonprofit_directory_v2",
      expect.objectContaining({ p_after: "012345678" })
    )
    const mismatch = await search(
      new Request(
        `https://coachhouse.app/api/public/nonprofits/search?q=different&cursor=${cursor}`
      )
    )
    expect(mismatch.status).toBe(400)
  })
  it("rejects unbounded limits and raw/private response fields", async () => {
    expect(
      (
        await search(
          new Request(
            "https://coachhouse.app/api/public/nonprofits/search?limit=1000"
          )
        )
      ).status
    ).toBe(400)
    expect(rpc).not.toHaveBeenCalled()
    rpc.mockResolvedValue({
      data: [{ ...item("012345678"), rawEvidence: "private" }],
      error: null,
    })
    const invalid = await search(
      new Request(
        "https://coachhouse.app/api/public/nonprofits/search?q=community"
      )
    )
    expect(invalid.status).toBe(503)
    expect(await invalid.text()).not.toContain("private")
  })
  it("detail preserves leading-zero EINs and returns 404 for hidden/missing organizations", async () => {
    rpc.mockResolvedValue({ data: null, error: null })
    expect(
      (
        await detail(new Request("https://coachhouse.app"), {
          params: Promise.resolve({ ein: "012345678" }),
        })
      ).status
    ).toBe(404)
    expect(rpc).toHaveBeenCalledWith("get_nonprofit_directory", {
      p_ein: "012345678",
    })
    expect(
      (
        await detail(new Request("https://coachhouse.app"), {
          params: Promise.resolve({ ein: "123" }),
        })
      ).status
    ).toBe(400)
  })
})

it("loads one bounded browser page and passes the cancellation signal without following next cursors", async () => {
  const controller = new AbortController()
  const fetchMock = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(
      new Response(
        JSON.stringify({
          version: 1,
          items: [item("012345678")],
          page: { hasMore: true, nextCursor: "next-page", limit: 20 },
        })
      )
    )
  const page = await loadNonprofitDirectoryPage(
    "community",
    null,
    controller.signal
  )
  expect(page.page.hasMore).toBe(true)
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/public/nonprofits/search?q=community&limit=20",
    expect.objectContaining({ signal: controller.signal })
  )
})

it("browses categories without a query and refuses cursors from another category", async () => {
  rpc.mockResolvedValue({
    data: [item("012345678"), item("012345679")],
    error: null,
  })
  const first = await search(
    new Request(
      "https://coachhouse.app/api/public/nonprofits/search?category=food&limit=1"
    )
  )
  const data = await first.json()
  expect(first.status).toBe(200)
  expect(rpc).toHaveBeenLastCalledWith(
    "search_nonprofit_directory_v2",
    expect.objectContaining({ p_query: "", p_category: "food" })
  )
  const cursor = encodeURIComponent(data.page.nextCursor)
  const mismatch = await search(
    new Request(
      `https://coachhouse.app/api/public/nonprofits/search?category=health&limit=1&cursor=${cursor}`
    )
  )
  expect(mismatch.status).toBe(400)
  const next = await search(
    new Request(
      `https://coachhouse.app/api/public/nonprofits/search?category=food&limit=1&cursor=${cursor}`
    )
  )
  expect(next.status).toBe(200)
  expect(rpc).toHaveBeenLastCalledWith(
    "search_nonprofit_directory_v2",
    expect.objectContaining({ p_after: "012345678", p_category: "food" })
  )
})

it("rejects unknown category keys and preserves exact service leaves", async () => {
  const invalid = await search(
    new Request(
      "https://coachhouse.app/api/public/nonprofits/search?category=made_up"
    )
  )
  expect(invalid.status).toBe(400)
  expect(rpc).not.toHaveBeenCalled()
  rpc.mockResolvedValue({ data: [], error: null })
  await search(
    new Request(
      "https://coachhouse.app/api/public/nonprofits/search?category=food_food_pantries"
    )
  )
  expect(rpc).toHaveBeenLastCalledWith(
    "search_nonprofit_directory_v2",
    expect.objectContaining({ p_category: "food_food_pantries" })
  )
})

it("passes category-only browser queries with bounded pagination", async () => {
  const fetchMock = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(
      new Response(
        JSON.stringify({
          version: 1,
          items: [],
          page: { hasMore: false, nextCursor: null, limit: 20 },
        })
      )
    )
  await loadNonprofitDirectoryPage(
    "",
    null,
    new AbortController().signal,
    "faith"
  )
  expect(fetchMock.mock.calls[0][0]).toBe(
    "/api/public/nonprofits/search?q=&limit=20&category=faith"
  )
})
