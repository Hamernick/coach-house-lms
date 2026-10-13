import { describe, expect, it } from "vitest"
import { groupResourcePlaces, mergeResourcePlace } from "@/features/find-resource-index/lib/resource-place-groups"
import { serializeFindResourceIndexItem } from "@/features/find-resource-index"
import { buildFindResourceCatalog, parseFindResourceCatalogQuery, queryFindResourceCatalog } from "@/features/find-resource-index/lib/catalog-query"
import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"

const library: ExternalResourceMapItem = {
  id: "resource_map:a", itemType: "external_resource", title: "Neighborhood Library", subtitle: null,
  description: "Library services", addressStreet: "115 S. Pulaski Rd.", address: null,
  city: "Chicago", state: "IL", country: "United States", latitude: 41.879345, longitude: -87.725476,
  orgCategory: null, resourceCategories: ["community_libraries"], primaryResourceCategory: "community_libraries",
  verificationStatus: "external_data", visibility: "published", sourceLabel: "Library provider", sourceUrl: null, lastVerifiedAt: null,
  services: [{ id: "a", title: "Library", description: "Books", eligibility: "Library card" }],
}
const food: ExternalResourceMapItem = { ...library, id: "resource_map:b", country: "US",
  addressStreet: "115 South Pulaski Road, Chicago, IL 60624", longitude: -87.72525,
  resourceCategories: ["food"], primaryResourceCategory: "food", description: "Food support", sourceLabel: "Food provider",
  services: [{ id: "b", title: "Meals", description: "Groceries", eligibility: "Call provider" }],
}

describe("published resource place identity", () => {
  it("groups the same published place across providers with stable identity and preserves both services", () => {
    const groups = groupResourcePlaces([food, library, library])
    expect(groups).toHaveLength(1)
    expect(groups[0].map((item) => item.id)).toEqual([library.id, food.id])
    const merged = mergeResourcePlace(groups[0])
    expect(merged.resourceCategories).toEqual(["community_libraries", "food"])
    expect(merged.services?.map((service) => service.eligibility)).toEqual(["Library card", "Call provider"])
    expect(merged.description).toContain("Food support")
    expect(merged.services?.[0].title).toBe("Library — Libraries")
    expect(merged.hoursLabel).toBeNull()
    expect(merged.availability).toBeUndefined()
  })
  it.each([
    { addressStreet: "117 South Pulaski Road" },
    { addressStreet: "115 South Pulaski Road, Suite 2" },
    { addressStreet: "115 South Pulaski Road, Chicago, IL 60624, Suite 2" },
    { longitude: -87.7 }, { latitude: null }, { city: "Oak Park" },
    { addressStreet: null }, { title: "Different provider" }, { visibility: "unpublished" },
  ])("keeps separate or uncertain places distinct: %j", (changes) => {
    expect(groupResourcePlaces([library, { ...food, ...changes } as ExternalResourceMapItem])).toHaveLength(2)
  })
  it("keeps both category searches, stable pagination, and saved alias lookup", () => {
    const item = { ...serializeFindResourceIndexItem(mergeResourcePlace([library, food])), relatedResourceIds: [library.id, food.id] }
    const catalog = buildFindResourceCatalog([item], "grouped")
    for (const category of ["all", "food", "community_libraries"]) {
      const options = parseFindResourceCatalogQuery(new URLSearchParams(`mode=directory&category=${category}&limit=1`))!
      expect(queryFindResourceCatalog(catalog, options).resourceItems).toHaveLength(1)
      expect(queryFindResourceCatalog(catalog, options).page.hasMore).toBe(false)
    }
    const params = new URLSearchParams({ mode: "directory", ids: JSON.stringify([food.id]) })
    expect(queryFindResourceCatalog(catalog, parseFindResourceCatalogQuery(params)!).resourceItems[0].id).toBe(food.id)
    expect(mergeResourcePlace([library, food], food.id).id).toBe(food.id)
    const aliases = { ...parseFindResourceCatalogQuery(params)!, ids: [library.id, food.id], limit: 1 }
    const first = queryFindResourceCatalog(catalog, aliases)
    const second = queryFindResourceCatalog(catalog, { ...aliases, cursor: first.page.nextCursor })
    expect(first.page.hasMore).toBe(true)
    expect(second.resourceItems[0].id).toBe(food.id)
    expect(second.page.hasMore).toBe(false)
  })
})
