import { describe, expect, it } from "vitest"

import {
  buildOrganizationGeocodeQueries,
  formatCompactOrganizationLocation,
  formatFullOrganizationLocation,
  normalizeOrganizationLocationFields,
} from "@/lib/location/organization-location"

describe("organization location normalization", () => {
  it("normalizes city, state, postal code, and country into a canonical public-map-friendly shape", () => {
    expect(
      normalizeOrganizationLocationFields({
        street: "  123 Main St  ",
        city: "CHICAGO",
        state: "illinois",
        postal: " 60601 ",
        country: "usa",
      }),
    ).toEqual({
      street: "123 Main St",
      city: "Chicago",
      state: "IL",
      postal: "60601",
      country: "United States",
    })
  })

  it("formats compact and full public labels with a standardized U.S. state code", () => {
    expect(
      formatCompactOrganizationLocation({
        city: "chicago",
        state: "Illinois",
        country: "UNITED STATES",
      }),
    ).toBe("Chicago, IL")

    expect(
      formatFullOrganizationLocation({
        city: "CHICAGO",
        state: "ill",
        country: "usa",
      }),
    ).toBe("Chicago, IL, United States")
  })

  it("builds fallback geocoding queries from most specific to least specific", () => {
    expect(
      buildOrganizationGeocodeQueries({
        street: "123 Main St",
        city: "CHICAGO",
        state: "Illinois",
        postal: "60601",
        country: "USA",
      }),
    ).toEqual([
      "123 Main St, Chicago, IL, 60601, United States",
      "123 Main St, Chicago, IL, United States",
      "Chicago, IL, 60601, United States",
      "Chicago, IL, United States",
    ])
  })

  it("falls back to the raw address when structured parts are missing", () => {
    expect(
      buildOrganizationGeocodeQueries({
        fallbackAddress: "  233 S Wacker Dr,\nChicago, IL 60606  ",
      }),
    ).toEqual(["233 S Wacker Dr, Chicago, IL 60606"])
  })
})
