import type { WorkspaceFinanceOpportunityStatus } from "../types"

export const WORKSPACE_FINANCE_OPPORTUNITY_BATCH_LIMIT = 500

const SOURCE_KEY_PATTERN = /^[a-z0-9][a-z0-9_-]{1,39}$/
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const OPPORTUNITY_TYPES = new Set([
  "grant",
  "contract",
  "sponsorship",
  "award",
  "partnership",
  "other",
] as const)

export type WorkspaceFinanceOpportunityCandidate = {
  externalId?: unknown
  title?: unknown
  sourceLabel?: unknown
  opportunityType?: unknown
  dueAt?: unknown
}

export type WorkspaceFinanceOpportunityIngestionBatch = {
  source: {
    id: string
    key: string
    name: string
    enabled: boolean
  }
  observedAt: string
  items: WorkspaceFinanceOpportunityCandidate[]
}

export type NormalizedWorkspaceFinanceOpportunity = {
  externalId: string
  title: string
  sourceLabel: string
  opportunityType:
    | "grant"
    | "contract"
    | "sponsorship"
    | "award"
    | "partnership"
    | "other"
  dueAt: string | null
  status: WorkspaceFinanceOpportunityStatus
}

export function normalizeWorkspaceFinanceOpportunityIngestionBatch(
  batch: WorkspaceFinanceOpportunityIngestionBatch
): {
  source: WorkspaceFinanceOpportunityIngestionBatch["source"]
  observedAt: string
  itemsSeen: number
  itemsRejected: number
  items: NormalizedWorkspaceFinanceOpportunity[]
} | null {
  const sourceName = normalizeText(batch.source.name, 120)
  const observedAt = normalizeTimestamp(batch.observedAt)
  if (
    !batch.source.enabled ||
    !UUID_PATTERN.test(batch.source.id) ||
    !SOURCE_KEY_PATTERN.test(batch.source.key) ||
    !sourceName ||
    !observedAt ||
    !Array.isArray(batch.items) ||
    batch.items.length > WORKSPACE_FINANCE_OPPORTUNITY_BATCH_LIMIT
  ) {
    return null
  }

  const seenExternalIds = new Set<string>()
  const items = batch.items.flatMap((candidate) => {
    const externalId = normalizeText(candidate.externalId, 256)
    const title = normalizeText(candidate.title, 200)
    const sourceLabel = normalizeText(candidate.sourceLabel, 120) ?? sourceName
    const opportunityType = normalizeOpportunityType(candidate.opportunityType)
    const dueAt =
      candidate.dueAt == null || candidate.dueAt === ""
        ? null
        : normalizeTimestamp(candidate.dueAt)

    if (
      !externalId ||
      !title ||
      !sourceLabel ||
      !opportunityType ||
      dueAt === undefined ||
      seenExternalIds.has(externalId)
    ) {
      return []
    }

    seenExternalIds.add(externalId)
    return [
      {
        externalId,
        title,
        sourceLabel,
        opportunityType,
        dueAt,
        status: "new" as const,
      },
    ]
  })

  return {
    source: { ...batch.source, name: sourceName },
    observedAt,
    itemsSeen: batch.items.length,
    itemsRejected: batch.items.length - items.length,
    items,
  }
}

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null
  const normalized = value.trim()
  return normalized && normalized.length <= maxLength ? normalized : null
}

function normalizeTimestamp(value: unknown): string | null | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

function normalizeOpportunityType(value: unknown) {
  if (value == null || value === "") return "other" as const
  return typeof value === "string" &&
    OPPORTUNITY_TYPES.has(
      value as NormalizedWorkspaceFinanceOpportunity["opportunityType"]
    )
    ? (value as NormalizedWorkspaceFinanceOpportunity["opportunityType"])
    : null
}
