import { describe, expect, it } from "vitest"

import {
  FIND_RESOURCE_INDEX_DEFAULT_PAGE_LIMIT,
  FIND_RESOURCE_INDEX_MAX_PAGE_LIMIT,
  FIND_RESOURCE_INDEX_VERSION,
  paginateFindResourceIndexItems,
  parseFindResourceIndexCursor,
  parseFindResourceIndexLimit,
  resolveFindResourceDetailItem,
  serializeFindResourceIndexItem,
} from "@/features/find-resource-index"
import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"

function buildResourceItem(): ExternalResourceMapItem {
  return {
    id: "resource_map:service-food-1",
    itemType: "external_resource",
    title: "Community Food Pantry",
    subtitle: "Neighborhood Resource Hub",
    description: "Weekly groceries and meal support.",
    latitude: 41.8781,
    longitude: -87.6298,
    address: "123 Pantry Ave, Chicago, IL 60601",
    addressStreet: "123 Pantry Ave",
    city: "Chicago",
    state: "IL",
    country: "United States",
    orgCategory: null,
    resourceCategories: ["food", "community"],
    primaryResourceCategory: "food",
    verificationStatus: "external_data",
    sourceLabel: "City open data",
    sourceUrl: "https://data.example.org/resources",
    lastVerifiedAt: "2026-08-11T20:00:00.000Z",
    visibility: "published",
    markerImageUrl: "https://resource.example.org/logo.png",
    aliases: ["NRH"],
    deliveryModes: ["in_person"],
    hoursLabel: "Weekdays 9-5",
    availability: {
      appointmentRequired: false,
      label: "Weekdays 9-5",
      nextCloseAt: null,
      nextOpenAt: null,
      notes: "Call before visiting.",
      openNow: true,
      sourceStatus: "available",
      status: "available",
      statusLabel: "Available",
      temporaryClosedUntil: null,
      timezone: "America/Chicago",
    },
    lastUpdatedAt: "2026-08-11T20:00:00.000Z",
    links: [
      {
        id: "link-1",
        label: "Website",
        url: "https://resource.example.org",
        type: "website",
        domain: "resource.example.org",
      },
    ],
    contacts: [
      {
        id: "contact-1",
        label: "Pantry desk",
        value: "+13125550123",
        type: "phone",
        url: "tel:+13125550123",
      },
    ],
    services: [
      {
        id: "service-food-1",
        title: "Community Food Pantry",
        description: "Weekly groceries and meal support.",
        eligibility: "Open to local residents.",
      },
    ],
  }
}

describe("find resource index feature contract", () => {
  it("serializes only fields needed to place, filter, and identify resources", () => {
    const serialized = serializeFindResourceIndexItem(buildResourceItem())

    expect(FIND_RESOURCE_INDEX_VERSION).toBe(2)
    expect(serialized).toEqual({
      id: "resource_map:service-food-1",
      itemType: "external_resource",
      title: "Community Food Pantry",
      subtitle: "Neighborhood Resource Hub",
      latitude: 41.8781,
      longitude: -87.6298,
      city: "Chicago",
      state: "IL",
      country: "United States",
      resourceCategories: ["food", "community"],
      primaryResourceCategory: "food",
      verificationStatus: "external_data",
      visibility: "published",
      markerImageUrl: "https://resource.example.org/logo.png",
      availability: {
        status: "available",
        statusLabel: "Available",
        openNow: true,
      },
    })
  })

  it("excludes detail, contact, source, and street-address fields", () => {
    const serialized = serializeFindResourceIndexItem(buildResourceItem())
    const serializedKeys = Object.keys(serialized)

    expect(serializedKeys).not.toEqual(
      expect.arrayContaining([
        "address",
        "addressStreet",
        "aliases",
        "contacts",
        "deliveryModes",
        "description",
        "hoursLabel",
        "lastUpdatedAt",
        "lastVerifiedAt",
        "links",
        "services",
        "sourceLabel",
        "sourceUrl",
      ])
    )
    expect(JSON.stringify(serialized).length).toBeLessThan(700)
  })

  it("omits unknown availability and empty marker images", () => {
    const item = buildResourceItem()
    item.markerImageUrl = null
    item.availability = {
      appointmentRequired: false,
      label: null,
      nextCloseAt: null,
      nextOpenAt: null,
      notes: null,
      openNow: null,
      sourceStatus: null,
      status: "unknown",
      statusLabel: "Unknown",
      temporaryClosedUntil: null,
      timezone: null,
    }

    expect(serializeFindResourceIndexItem(item)).not.toHaveProperty(
      "markerImageUrl"
    )
    expect(serializeFindResourceIndexItem(item)).not.toHaveProperty(
      "availability"
    )
  })

  it("validates bounded page limits", () => {
    expect(parseFindResourceIndexLimit(null)).toBe(
      FIND_RESOURCE_INDEX_DEFAULT_PAGE_LIMIT
    )
    expect(parseFindResourceIndexLimit("1")).toBe(1)
    expect(parseFindResourceIndexLimit("500")).toBe(
      FIND_RESOURCE_INDEX_MAX_PAGE_LIMIT
    )
    expect(parseFindResourceIndexLimit("0")).toBeNull()
    expect(parseFindResourceIndexLimit("501")).toBeNull()
    expect(parseFindResourceIndexLimit("2.5")).toBeNull()
  })

  it("validates public and local cursors", () => {
    expect(parseFindResourceIndexCursor(null)).toBeNull()
    expect(
      parseFindResourceIndexCursor(
        "resource_map:0072e21f-c0ce-4544-9bd4-40a75be58794"
      )
    ).toBe("resource_map:0072e21f-c0ce-4544-9bd4-40a75be58794")
    expect(parseFindResourceIndexCursor("local_resource_map:food-1")).toBe(
      "local_resource_map:food-1"
    )
    expect(
      parseFindResourceIndexCursor("resource_map:not-a-uuid")
    ).toBeUndefined()
  })

  it("returns deterministic cursor pages without duplicates", () => {
    const item = serializeFindResourceIndexItem(buildResourceItem())
    const items = ["resource:c", "resource:a", "resource:b"].map((id) => ({
      ...item,
      id,
    }))

    const firstPage = paginateFindResourceIndexItems({
      cursor: null,
      items,
      limit: 2,
    })
    const secondPage = paginateFindResourceIndexItems({
      cursor: firstPage.page.nextCursor,
      items,
      limit: 2,
    })

    expect(firstPage).toMatchObject({
      version: 2,
      resourceItems: [{ id: "resource:a" }, { id: "resource:b" }],
      page: {
        hasMore: true,
        limit: 2,
        nextCursor: "resource:b",
        totalCount: 3,
      },
    })
    expect(secondPage).toMatchObject({
      resourceItems: [{ id: "resource:c" }],
      page: {
        hasMore: false,
        nextCursor: null,
        totalCount: 3,
      },
    })
  })

  it("resumes after a cursor that disappeared during refresh", () => {
    const item = serializeFindResourceIndexItem(buildResourceItem())
    const page = paginateFindResourceIndexItems({
      cursor: "resource:b",
      items: ["resource:a", "resource:c", "resource:d"].map((id) => ({
        ...item,
        id,
      })),
      limit: 2,
    })

    expect(page.resourceItems.map(({ id }) => id)).toEqual([
      "resource:c",
      "resource:d",
    ])
  })

  it("returns one sanitized detail item by exact public ID", () => {
    const item = buildResourceItem()
    item.faviconUrl = "https://resource.example.org/favicon.ico"
    item.logoUrl = "https://resource.example.org/logo.svg"

    expect(resolveFindResourceDetailItem([item], item.id)).toMatchObject({
      id: item.id,
      title: item.title,
    })
    expect(resolveFindResourceDetailItem([item], item.id)).not.toHaveProperty(
      "faviconUrl"
    )
    expect(
      resolveFindResourceDetailItem([item], "resource_map:missing")
    ).toBeNull()
  })
})
