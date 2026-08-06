import { describe, expect, it } from "vitest"

import {
  collectPersonTagOptions,
  DEFAULT_ORGANIZATION_PEOPLE_TAG_COLOR,
  getOrganizationPeopleTagColorHex,
  isOrganizationPeopleTagUuid,
  MAX_PERSON_TAGS,
  normalizeOrganizationPeopleTagColor,
  normalizePersonTag,
  normalizePersonTags,
} from "@/lib/people/tags"

describe("people tags", () => {
  it("normalizes reusable labels without case-insensitive duplicates", () => {
    expect(
      normalizePersonTags(["  Warm lead ", "warm lead", "Partner   org", ""])
    ).toEqual(["Warm lead", "Partner org"])
    expect(normalizePersonTag("x".repeat(80))).toHaveLength(32)
  })

  it("limits tags per person while retaining a larger sorted option list", () => {
    const tags = Array.from(
      { length: MAX_PERSON_TAGS + 5 },
      (_, index) => `Tag ${index}`
    )
    expect(normalizePersonTags(tags)).toHaveLength(MAX_PERSON_TAGS)
    expect(collectPersonTagOptions(["Zulu", "alpha", "Beta"])).toEqual([
      "alpha",
      "Beta",
      "Zulu",
    ])
  })

  it("normalizes saved colors to the supported tag palette", () => {
    expect(normalizeOrganizationPeopleTagColor("violet")).toBe("violet")
    expect(normalizeOrganizationPeopleTagColor("chartreuse")).toBe(
      DEFAULT_ORGANIZATION_PEOPLE_TAG_COLOR
    )
    expect(getOrganizationPeopleTagColorHex("red")).toMatch(/^#[0-9A-F]{6}$/)
  })

  it("accepts only persisted UUID tag identifiers", () => {
    expect(
      isOrganizationPeopleTagUuid("8ef6b226-471a-4a72-a8ae-22e8369a6f1f")
    ).toBe(true)
    expect(isOrganizationPeopleTagUuid("legacy:test")).toBe(false)
  })
})
