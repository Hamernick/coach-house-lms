import { describe, expect, it } from "vitest"

import {
  buildFeedingIllinoisRecord,
  buildLocationSearchUrl,
  buildSchedulesUrl,
  dedupeFeedingIllinoisRecords,
} from "../../scripts/resource-map/lib/feeding-illinois-food-resources.mjs"

const location = {
  address1: "126 E Chestnut St",
  city: "Chicago",
  contactEmail: "hello@example.org",
  foodPrograms: " Pantry/Grocery Distribution, Hot Meal Program",
  latitude: 41.89871,
  locationFeatures: "Wheelchair Accessible",
  locationId: 541,
  locationName: "Chicago Lights",
  longitude: -87.62544,
  phone: "312-640-2571",
  serviceAreas: "ZIP CODE: 60601; ZIP CODE: 60611",
  serviceLanguages: "English, Spanish",
  state: "IL",
  website: "chicagolights.org",
  zipCode: "60611    ",
}

const schedules = [
  {
    dayOfWeek: 3,
    endTimeDescr: "11:30 AM",
    locationId: 541,
    locationServiceId: 893,
    startTimeDescr: "9:30 AM",
    weekDayDescr: "Tuesday",
  },
]

describe("Feeding Illinois food-resource ingestion", () => {
  it("maps provider-directory rows into category-rich review records", () => {
    const record = buildFeedingIllinoisRecord({
      fetchedAt: "2026-07-15T12:00:00.000Z",
      location,
      rawApiUrl: "https://api.accessfood.org/api/MapInformation/LocationSearch",
      schedules,
    })

    expect(record).toMatchObject({
      sourceId: "feeding-illinois-food-resources",
      sourceRecordId: "541",
      sourceType: "provider_directory",
      sourceUrl: "https://www.feedingillinois.org/food-resources-illinois",
      extractedFields: {
        address: "126 E Chestnut St, Chicago, IL 60611",
        city: "Chicago",
        email: "hello@example.org",
        eligibility: expect.stringContaining("does not state"),
        primaryResourceCategory: "food_community_meals",
        resourceCategories: [
          "food_community_meals",
          "food_food_pantries",
          "food",
        ],
        title: "Chicago Lights",
        websiteUrl: "https://chicagolights.org",
      },
    })
    expect(record.extractedFields.description.length).toBeGreaterThanOrEqual(80)
    expect(record.extractedFields.hours).toEqual({
      label: "Tuesday 9:30 AM-11:30 AM",
      weekly: {
        tuesday: [{ closesAt: "11:30 AM", opensAt: "9:30 AM" }],
      },
    })
    expect(record.extractedFields.enrichment.verification.status).toBe(
      "needs_review"
    )
    expect(record.extractedFields.links[0]).toMatchObject({
      label: "Provider website",
      url: "https://chicagolights.org",
    })
    expect(record.extractedFields.links[0].url).not.toContain("accessfood.org")
  })

  it("keeps API endpoints deterministic and outside public link fields", () => {
    const searchUrl = buildLocationSearchUrl({ page: 2 })
    const schedulesUrl = buildSchedulesUrl({ locationIds: [541, 623] })

    expect(searchUrl).toContain("page=2")
    expect(searchUrl).toContain("regionMapId=96")
    expect(schedulesUrl).toContain("LocationIds=541%2C623")
    expect(schedulesUrl).toContain("MapRegionId=66")
  })

  it("deduplicates identical locations while retaining the richer record", () => {
    const sparse = buildFeedingIllinoisRecord({
      fetchedAt: "2026-07-15T12:00:00.000Z",
      location: {
        ...location,
        contactEmail: null,
        locationId: 540,
        phone: null,
        website: null,
      },
      rawApiUrl:
        "https://api.accessfood.org/api/MapInformation/LocationSearch?page=0",
    })
    const rich = buildFeedingIllinoisRecord({
      fetchedAt: "2026-07-15T12:00:00.000Z",
      location,
      rawApiUrl:
        "https://api.accessfood.org/api/MapInformation/LocationSearch?page=1",
      schedules,
    })

    expect(dedupeFeedingIllinoisRecords([sparse, rich])).toEqual([rich])
  })

  it("decodes directory HTML entities before splitting service labels", () => {
    const record = buildFeedingIllinoisRecord({
      fetchedAt: "2026-07-15T12:00:00.000Z",
      location: {
        ...location,
        foodPrograms:
          "Pantry/Grocery Distribution; Mental Health &amp; Wellness Services",
      },
      rawApiUrl: "https://api.accessfood.org/api/MapInformation/LocationSearch",
    })

    expect(record.extractedFields.foodPrograms).toContain(
      "Mental Health & Wellness Services"
    )
    expect(record.extractedFields.description).not.toContain("&amp")
  })

  it("uses the source-provided contact phone when the location phone is empty", () => {
    const record = buildFeedingIllinoisRecord({
      fetchedAt: "2026-08-13T12:00:00.000Z",
      location: {
        ...location,
        contactPhone: "312-900-5044",
        phone: null,
      },
      rawApiUrl: "https://api.accessfood.org/api/MapInformation/LocationSearch",
      schedules,
    })

    expect(record.extractedFields.phone).toBe("312-900-5044")
    expect(record.extractedFields.accessInstructions).toContain(
      "Call 312-900-5044"
    )
    expect(record.fieldEvidence).toContainEqual(
      expect.objectContaining({ fieldPath: "extractedFields.phone" })
    )
  })
})
