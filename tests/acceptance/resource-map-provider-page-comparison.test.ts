import { describe, expect, it } from "vitest"

import {
  applyProviderPageComparison,
  compareProviderPageSnapshot,
  readProviderWebsite,
} from "../../scripts/resource-map/lib/provider-page-comparison.mjs"

const record = {
  extractedFields: {
    enrichment: {
      sourceComparisonCount: 1,
      verification: {
        contradictions: [],
        status: "needs_review",
        unsupportedClaims: [],
      },
    },
    links: [
      {
        isPrimary: true,
        label: "Provider website",
        type: "website",
        url: "https://housingforward.org/help",
      },
    ],
    organizationName: "Housing Forward",
    phone: "708-338-1724",
    serviceTitle: "Housing Forward - Emergency Overnight Shelter",
    websiteUrl: "https://housingforward.org/help",
  },
  fieldEvidence: [],
  rawSnapshot: { program: { id: 1 } },
}

function fetchedSnapshot(overrides = {}) {
  return {
    checkedAt: "2026-07-15T20:00:00.000Z",
    contentHash: "abc123",
    contentType: "text/html",
    evidenceSnippet:
      "housing forward emergency overnight shelter call 708 338 1724",
    fetchStatus: "fetched",
    finalUrl: "https://housingforward.org/help",
    httpStatus: 200,
    pageTitle: "Housing Forward",
    visibleText:
      "housing forward emergency overnight shelter call 708 338 1724",
    websiteUrl: "https://housingforward.org/help",
    ...overrides,
  }
}

describe("resource-map provider page comparison", () => {
  it("adds a second comparison only when provider identity is supported", () => {
    const comparison = compareProviderPageSnapshot(record, fetchedSnapshot())
    const enriched = applyProviderPageComparison(record, comparison)

    expect(comparison.status).toBe("supported")
    expect(comparison.matchedSignals).toContain("exact_provider_name")
    expect(enriched.extractedFields.enrichment.sourceComparisonCount).toBe(2)
    expect(enriched.extractedFields.enrichment.verification.status).toBe(
      "needs_review"
    )
    expect(enriched.fieldEvidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          evidenceType: "provider_page",
          transformation: "provider_page_identity_comparison",
        }),
      ])
    )
    expect(enriched.rawSnapshot.providerPageEvidence.contentHash).toBe("abc123")
  })

  it("supports an established whole-token provider acronym", () => {
    const acronymRecord = {
      ...record,
      extractedFields: {
        ...record.extractedFields,
        organizationName: "Hebrew Immigrant Aid Society of Chicago",
        providerName: "Hebrew Immigrant Aid Society of Chicago",
      },
    }
    const comparison = compareProviderPageSnapshot(
      acronymRecord,
      fetchedSnapshot({
        pageTitle: "HIAS Chicago",
        visibleText: "HIAS Chicago immigration and citizenship services",
      })
    )

    expect(comparison.status).toBe("supported")
    expect(comparison.matchedSignals).toContain("provider_name_acronym")
  })

  it("supports an established provider acronym in the same-site domain", () => {
    const acronymRecord = {
      ...record,
      extractedFields: {
        ...record.extractedFields,
        organizationName: "Chinese American Service League",
        providerName: "Chinese American Service League",
        websiteUrl: "https://www.caslservice.org",
      },
    }
    const comparison = compareProviderPageSnapshot(
      acronymRecord,
      fetchedSnapshot({
        finalUrl: "https://www.caslservice.org/",
        visibleText: "",
        websiteUrl: "https://www.caslservice.org",
      })
    )

    expect(comparison.status).toBe("supported")
    expect(comparison.matchedSignals).toContain("provider_acronym_domain")
  })

  it("does not trust an acronym on a cross-site redirect domain", () => {
    const acronymRecord = {
      ...record,
      extractedFields: {
        ...record.extractedFields,
        organizationName: "Chinese American Service League",
        providerName: "Chinese American Service League",
        websiteUrl: "https://www.caslservice.org",
      },
    }
    const comparison = compareProviderPageSnapshot(
      acronymRecord,
      fetchedSnapshot({
        finalUrl: "https://casl-example.net/",
        visibleText: "",
        websiteUrl: "https://www.caslservice.org",
      })
    )

    expect(comparison.status).toBe("contradicted")
    expect(comparison.matchedSignals).not.toContain("provider_acronym_domain")
  })

  it("removes a provider link that redirects cross-site without an identity match", () => {
    const comparison = compareProviderPageSnapshot(
      record,
      fetchedSnapshot({
        evidenceSnippet: "unrelated gambling offers",
        finalUrl: "https://unrelated-example.co/",
        visibleText: "unrelated gambling offers",
      })
    )
    const enriched = applyProviderPageComparison(record, comparison)

    expect(comparison.status).toBe("contradicted")
    expect(readProviderWebsite(enriched)).toBeNull()
    expect(enriched.extractedFields.links).toEqual([])
    expect(
      enriched.extractedFields.enrichment.verification.contradictions
    ).toEqual([
      expect.objectContaining({ code: "provider_website_redirect_mismatch" }),
    ])
  })

  it("removes dead links but keeps same-site weak matches in review", () => {
    const dead = applyProviderPageComparison(record, {
      checkedAt: "2026-07-15T20:00:00.000Z",
      fetchStatus: "dead_link",
      finalUrl: "https://housingforward.org/help",
      httpStatus: 404,
      status: "dead_link",
      websiteUrl: "https://housingforward.org/help",
    })
    expect(readProviderWebsite(dead)).toBeNull()

    const weakComparison = compareProviderPageSnapshot(
      record,
      fetchedSnapshot({ visibleText: "generic help page" })
    )
    const weak = applyProviderPageComparison(record, weakComparison)
    expect(weakComparison.status).toBe("weak_match")
    expect(readProviderWebsite(weak)).toBe("https://housingforward.org/help")
    expect(weak.extractedFields.enrichment.sourceComparisonCount).toBe(1)
  })
})
