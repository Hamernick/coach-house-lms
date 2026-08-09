import { describe, expect, it } from "vitest"

import {
  buildMetroChicagoProgramsUrl,
  buildMetroChicagoShelterRecord,
  isPublicMetroChicagoHousingProgram,
} from "../../scripts/resource-map/lib/metro-chicago-shelters.mjs"

const program = {
  agency_status: "Active",
  application_process: "Call Housing Forward for additional information.",
  categories: [{ id: 142, name: "Community Shelters" }],
  contact_phone: "(708) 338-1724",
  description:
    "<p>Housing Forward provides overnight emergency shelter, meals, showers, a medical clinic, storage, and navigation support.</p>",
  eligibility:
    "Open to west suburban Cook County residents experiencing homelessness.",
  hours: '{"days":[{"opens":"7:00pm","closes":"8:00am","dayOfWeek":"Mon"}]}',
  id: 85711114,
  languages: "English, Spanish",
  modified_at: "2025-10-13T20:18:43.76Z",
  name: "Emergency Overnight Shelter",
  program_fee: "Free",
  site: {
    city_id: 50,
    lat: "41.8815069",
    lng: "-87.7751951",
    name: "Housing Forward - Emergency Overnight Shelter",
    physical_address: "38 North Austin Boulevard, Oak Park, IL",
    zip: { name: "60302" },
  },
  website:
    "https://www.housingforward.org/programs/emergency-overnight-shelter",
  agency: { name: "Housing Forward" },
}

describe("211 Metro Chicago shelter ingestion", () => {
  it("admits public shelter services while holding residential care", () => {
    expect(
      isPublicMetroChicagoHousingProgram({
        categories: [{ name: "Domestic Violence Shelters" }],
      })
    ).toBe(true)
    expect(
      isPublicMetroChicagoHousingProgram({
        categories: [{ name: "Homeless Permanent Supportive Housing" }],
      })
    ).toBe(true)
    expect(
      isPublicMetroChicagoHousingProgram({
        categories: [{ name: "Transitional Housing/Shelter" }],
      })
    ).toBe(true)
    expect(
      isPublicMetroChicagoHousingProgram({
        categories: [{ name: "Assisted Living Facilities" }],
      })
    ).toBe(false)
    expect(
      isPublicMetroChicagoHousingProgram({
        categories: [{ name: "Secured Supportive Housing Units" }],
      })
    ).toBe(false)
  })

  it("maps current shelter records without exposing API URLs", () => {
    const record = buildMetroChicagoShelterRecord({
      cityName: "Oak Park",
      fetchedAt: "2026-07-15T12:00:00.000Z",
      program,
      rawApiUrl:
        "https://api.211metrochicago.org/api/programs?category_id=142&page=1",
      requestedCategoryId: 142,
    })

    expect(record).toMatchObject({
      sourceId: "211-metro-chicago-housing-services",
      sourceRecordId: "85711114",
      sourceUrl: expect.stringContaining(
        "211metrochicago.org/search-for-resources"
      ),
      extractedFields: {
        city: "Oak Park",
        cost: "Free",
        latitude: 41.8815069,
        longitude: -87.7751951,
        primaryResourceCategory: "housing_emergency_shelter",
        resourceCategories: expect.arrayContaining([
          "housing_emergency_shelter",
          "housing_homeless_services",
          "housing",
        ]),
        title: "Housing Forward - Emergency Overnight Shelter",
      },
    })
    expect(record.extractedFields.description).not.toContain("<p>")
    expect(record.extractedFields.hours.weekly.monday).toEqual([
      { closesAt: "8:00am", opensAt: "7:00pm" },
    ])
    expect(record.extractedFields.links[0].url).not.toContain(
      "api.211metrochicago.org"
    )
    expect(record.extractedFields.enrichment.verification.status).toBe(
      "needs_review"
    )
  })

  it("builds stable category-page API URLs", () => {
    const url = buildMetroChicagoProgramsUrl({ categoryId: 294, page: 3 })
    expect(url).toContain("category_id=294")
    expect(url).toContain("page=3")
  })

  it("uses the specific program instead of a generic office as the title", () => {
    const record = buildMetroChicagoShelterRecord({
      cityName: "Chicago",
      fetchedAt: "2026-07-15T12:00:00.000Z",
      program: {
        ...program,
        agency: { name: "Family Rescue" },
        id: 86666845,
        name: "Rosenthal Family Lodge",
        site: {
          ...program.site,
          name: "Family Rescue - Administration Office",
        },
      },
      rawApiUrl:
        "https://api.211metrochicago.org/api/programs?category_id=142&page=1",
      requestedCategoryId: 142,
    })

    expect(record.extractedFields.title).toBe(
      "Family Rescue - Rosenthal Family Lodge"
    )
    expect(record.extractedFields.title).not.toContain("Administration Office")
  })
})
