export type ResourceMapReviewComparison = {
  field: string
  label: string
  sourceValue: unknown
  extractedValue: unknown
  confidence: number | null
  sourceUrl: string | null
}

export type ResourceMapReviewCheck = {
  key: string
  label: string
  complete: boolean
  detail: string
}

export type ResourceMapReviewCitation = {
  claimPaths: string[]
  evidenceSnippet: string | null
  sourceUrl: string
}

export type ResourceMapReviewSummary = {
  aiDraft: Record<string, unknown> | null
  verification: Record<string, unknown> | null
  citations: ResourceMapReviewCitation[]
  comparisons: ResourceMapReviewComparison[]
  checks: ResourceMapReviewCheck[]
  blockers: string[]
  conflicts: string[]
  readyForHumanApproval: boolean
}
