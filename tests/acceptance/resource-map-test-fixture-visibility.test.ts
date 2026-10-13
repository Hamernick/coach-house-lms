import { beforeEach, describe, expect, it, vi } from "vitest"

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }))
vi.mock("@supabase/supabase-js", () => ({ createClient: createClientMock }))
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }))
vi.mock("@/lib/env", () => ({ env: {
  RESOURCE_MAP_PUBLIC_DB_ENABLED: "true",
  NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-only",
} }))

import { fetchPublicResourceIndexSnapshot } from "@/lib/queries/resource-map-index-snapshot"
import { fetchPublicResourceMapItemById, fetchPublicResourceMapItems } from "@/lib/queries/resource-map-public-items"
import { buildExternalResourceMapItemFromPublicRow } from "@/lib/public-map/resource-map-public-item-adapter"
import { shouldShowPublicMapResourceItem } from "@/lib/public-map/resource-item-visibility"

const ids = ["8b2441bf-7acc-4219-b108-142167c18252", "ada4ffc9-20ce-42a6-9d92-02e44fe7ed08"]
const fixture = (id: string) => ({
  item_id: id, title: "RLS Resource Service", subtitle: "RLS Resource Org", organization_name: "RLS Resource Org",
  description: "Public approved test service.", source_url: "https://example.org/service",
  latitude: 40.7128, longitude: -74.006, address_line1: null, city: "New York", state: "NY", country: "United States",
  primary_resource_category: "food", resource_categories: ["food"],
})
const real = { ...fixture("real-place"), title: "Neighborhood Food Pantry", organization_name: "Neighborhood Food Pantry", subtitle: null, source_url: "https://pantry.test/services" }

beforeEach(() => vi.clearAllMocks())

describe("public resource test-fixture exclusion", () => {
  it.each(ids)("does not expose leaked fixture %s through a detail link", async (id) => {
    createClientMock.mockReturnValue({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: fixture(id), error: null }) }) }) }) })
    expect(await fetchPublicResourceMapItemById(`resource_map:${id}`)).toBeNull()
  })
  it("excludes test records from the compact map/catalog projection", async () => {
    const rows = [...ids.map(fixture), real]
    createClientMock.mockReturnValue({ from: () => ({ select: () => ({ order: () => ({ limit: async () => ({ data: rows, error: null }) }) }) }) })
    expect((await fetchPublicResourceIndexSnapshot()).map((item) => item.id)).toEqual(["resource_map:real-place"])
  })
  it("excludes test records from the legacy public RPC", async () => {
    createClientMock.mockReturnValue({ rpc: async () => ({ data: [...ids.map(fixture), real], error: null }) })
    expect((await fetchPublicResourceMapItems()).map((item) => item.id)).toEqual(["resource_map:real-place"])
  })
  it.each([
    { source_url: "https://real-provider.test/service" },
    { title: "RLS Community Food Pantry" },
    { subtitle: "RLS Community Center", organization_name: "RLS Community Center" },
  ])("does not suppress a real resource based on a partial fixture match: %j", (changes) => {
    const item = buildExternalResourceMapItemFromPublicRow({ ...fixture("real"), ...changes })!
    expect(shouldShowPublicMapResourceItem(item)).toBe(true)
  })
})
