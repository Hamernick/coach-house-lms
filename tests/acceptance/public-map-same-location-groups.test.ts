import { describe, expect, it } from "vitest"

import {
  buildSameLocationGroups,
  resolveSameLocationGroupKey,
  resolveSameLocationLabel,
} from "@/components/public/public-map-index/same-location-groups"

describe("same-location groups", () => {
  it("groups organizations that share the same exact coordinates", () => {
    const groups = buildSameLocationGroups([
      {
        id: "org-a",
        name: "Org A",
        latitude: 41.8781,
        longitude: -87.6298,
        address: "233 S Wacker Dr, Chicago, IL 60606",
        addressStreet: "233 S Wacker Dr",
        city: "Chicago",
        state: "IL",
        country: "United States",
      },
      {
        id: "org-b",
        name: "Org B",
        latitude: 41.8781,
        longitude: -87.6298,
        address: "233 S Wacker Dr, Chicago, IL 60606",
        addressStreet: "233 S Wacker Dr",
        city: "Chicago",
        state: "IL",
        country: "United States",
      },
      {
        id: "org-c",
        name: "Org C",
        latitude: 41.8782,
        longitude: -87.6298,
        address: null,
        addressStreet: "401 N Michigan Ave",
        city: "Chicago",
        state: "IL",
        country: "United States",
      },
    ])

    expect(groups).toHaveLength(2)
    expect(groups[0]?.organizations.map((organization) => organization.id)).toEqual([
      "org-a",
      "org-b",
    ])
    expect(groups[1]?.organizations.map((organization) => organization.id)).toEqual([
      "org-c",
    ])
  })

  it("uses a stable coordinate key for shared-location markers", () => {
    expect(
      resolveSameLocationGroupKey({
        longitude: -87.6298,
        latitude: 41.8781,
      }),
    ).toBe("-87.629800:41.878100")
  })

  it("prefers the full address before falling back to city-state-country labels", () => {
    expect(
      resolveSameLocationLabel({
        address: "233 S Wacker Dr, Chicago, IL 60606",
        addressStreet: "233 S Wacker Dr",
        city: "Chicago",
        state: "IL",
        country: "United States",
      }),
    ).toBe("233 S Wacker Dr, Chicago, IL 60606")

    expect(
      resolveSameLocationLabel({
        address: null,
        addressStreet: null,
        city: "Chicago",
        state: "IL",
        country: "United States",
      }),
    ).toBe("Chicago, IL, United States")
  })
})
