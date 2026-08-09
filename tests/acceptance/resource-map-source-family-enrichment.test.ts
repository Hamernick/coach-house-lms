import { describe, expect, it } from "vitest"

import {
  buildReplacementRecordMap,
  enrichSourceFamilyRecord,
  summarizeFamilyCounts,
} from "../../scripts/resource-map/lib/source-family-enrichment.mjs"

describe("resource map source-family enrichment", () => {
  it("merges retained library enrichment by stable source identity", () => {
    const replacement = {
      sourceId: "chicago-socrata-public-libraries",
      sourceRecordId: "library-1",
      extractedFields: { title: "Verified Library" },
    }
    const result = enrichSourceFamilyRecord({
      libraryRecordsByKey: buildReplacementRecordMap([replacement]),
      now: "2026-07-14T22:00:00.000Z",
      record: {
        sourceId: "chicago-socrata-public-libraries",
        sourceRecordId: "library-1",
        extractedFields: { title: "Raw Library" },
      },
    })

    expect(result).toEqual({ family: "library", record: replacement })
  })

  it("preserves unsupported source families without changing their data", () => {
    const record = {
      sourceId: "unsupported-source",
      sourceRecordId: "record-1",
      extractedFields: { title: "Unchanged" },
    }

    expect(
      enrichSourceFamilyRecord({
        now: "2026-07-14T22:00:00.000Z",
        record,
      })
    ).toEqual({ family: "unmatched", record })
  })

  it("holds NYC heat records unchanged until their source-specific enrichment exists", () => {
    const record = {
      sourceId: "nyc-arcgis-cool-options",
      sourceRecordId: "nyc-1",
      extractedFields: { title: "Spray shower" },
    }

    expect(
      enrichSourceFamilyRecord({
        now: "2026-07-14T22:00:00.000Z",
        record,
      })
    ).toEqual({ family: "nyc_heat_held", record })
  })

  it("sorts family counts for deterministic reporting", () => {
    expect(
      summarizeFamilyCounts(
        new Map([
          ["nyc_heat", 1955],
          ["community_reference", 626],
        ])
      )
    ).toEqual({ community_reference: 626, nyc_heat: 1955 })
  })
})
