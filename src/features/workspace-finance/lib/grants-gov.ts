import type { WorkspaceFinanceOpportunityCandidate } from "./opportunity-ingestion"

export const GRANTS_GOV_SOURCE_KEY = "grants_gov"
export const GRANTS_GOV_SEARCH_ENDPOINT =
  "https://api.grants.gov/v1/api/search2"
export const GRANTS_GOV_ATTRIBUTION_NOTICE =
  "This product uses the Grants.gov API but is not endorsed or certified by the U.S. Department of Health and Human Services."

export function buildGrantsGovSearchRequest({
  keyword,
  rows = 50,
}: {
  keyword: string
  rows?: number
}) {
  const normalizedKeyword = keyword.trim()
  if (
    normalizedKeyword.length < 2 ||
    normalizedKeyword.length > 100 ||
    !Number.isInteger(rows) ||
    rows < 1 ||
    rows > 50
  ) {
    return null
  }

  return {
    rows,
    keyword: normalizedKeyword,
    oppStatuses: "forecasted|posted",
    startRecordNum: 0,
  }
}

export function mapGrantsGovSearchResponse(
  value: unknown
): WorkspaceFinanceOpportunityCandidate[] | null {
  if (!isRecord(value) || value.errorcode !== 0 || !isRecord(value.data)) {
    return null
  }
  const hits = value.data.oppHits
  if (!Array.isArray(hits) || hits.length > 50) return null

  return hits.flatMap((hit) => {
    if (!isRecord(hit)) return []
    const status = normalizeString(hit.oppStatus)?.toLowerCase()
    if (status !== "posted" && status !== "forecasted") return []

    const externalId =
      typeof hit.id === "number" && Number.isFinite(hit.id)
        ? String(hit.id)
        : normalizeString(hit.id)
    const title = normalizeString(hit.title)
    if (!externalId || !title) return []

    const dueAt = parseGrantsGovDate(hit.closeDate)
    if (hit.closeDate && !dueAt) return []

    return [
      {
        externalId,
        title,
        sourceLabel: normalizeString(hit.agencyName) ?? "Grants.gov",
        opportunityType: "grant",
        dueAt,
      },
    ]
  })
}

function parseGrantsGovDate(value: unknown) {
  if (value == null || value === "") return null
  if (typeof value !== "string") return undefined
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim())
  if (!match) return undefined
  const month = Number(match[1])
  const day = Number(match[2])
  const year = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day, 23, 59, 59))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined
  }
  return date.toISOString()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizeString(value: unknown) {
  if (typeof value !== "string") return null
  const normalized = value.trim()
  return normalized || null
}
