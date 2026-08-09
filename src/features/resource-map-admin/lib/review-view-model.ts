import type {
  ResourceMapAdminEnrichmentRunRow,
  ResourceMapAdminFieldEvidenceRow,
  ResourceMapAdminImportRecordDetailRow,
} from "../types"
import type {
  ResourceMapReviewCheck,
  ResourceMapReviewCitation,
  ResourceMapReviewSummary,
} from "./review-view-types"
import { safeResourceMapExternalUrl } from "./review-format"

export type {
  ResourceMapReviewCheck,
  ResourceMapReviewCitation,
  ResourceMapReviewComparison,
  ResourceMapReviewSummary,
} from "./review-view-types"

type JsonObject = Record<string, unknown>

const REVIEW_FIELDS = [
  {
    field: "organizationName",
    label: "Provider",
    aliases: ["providerName", "name"],
  },
  {
    field: "serviceTitle",
    label: "Public Title",
    aliases: ["displayTitle", "title"],
  },
  {
    field: "description",
    label: "Public Summary",
    aliases: ["publicSummary", "serviceDescription"],
  },
  { field: "services", label: "Services", aliases: [] },
  { field: "eligibility", label: "Eligibility", aliases: [] },
  {
    field: "accessInstructions",
    label: "How To Access",
    aliases: ["howToAccess"],
  },
  { field: "address", label: "Address", aliases: ["serviceArea"] },
  { field: "phone", label: "Phone", aliases: [] },
  { field: "email", label: "Email", aliases: [] },
  {
    field: "intakeUrl",
    label: "Intake Link",
    aliases: ["websiteUrl", "website_url"],
  },
] as const

function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function readString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return null
}

function readPath(object: JsonObject, paths: readonly string[]) {
  for (const path of paths) {
    const parts = path.split(".")
    let value: unknown = object
    for (const part of parts) value = asObject(value)[part]
    if (value !== undefined && value !== null && value !== "") return value
  }
  return null
}

function findLatestRun(
  runs: ResourceMapAdminEnrichmentRunRow[],
  passType: string
) {
  return runs.find((run) => run.pass_type === passType) ?? null
}

function readAiDraft(
  fields: JsonObject,
  runs: ResourceMapAdminEnrichmentRunRow[]
) {
  const runResult = asObject(findLatestRun(runs, "draft")?.structured_result)
  const runDraft = asObject(runResult.draft)
  if (Object.keys(runDraft).length > 0) return runDraft
  if (Object.keys(runResult).length > 0) return runResult
  if (Object.keys(asObject(fields.enrichment)).length === 0) return null

  return Object.fromEntries(
    REVIEW_FIELDS.map(({ field, aliases }) => [
      field,
      readPath(fields, [field, ...aliases]),
    ]).filter(([, value]) => value !== null)
  )
}

function readVerification(
  fields: JsonObject,
  runs: ResourceMapAdminEnrichmentRunRow[]
) {
  const runResult = asObject(
    findLatestRun(runs, "verification")?.structured_result
  )
  const runVerification = asObject(runResult.verification)
  if (Object.keys(runVerification).length > 0) return runVerification
  if (Object.keys(runResult).length > 0) return runResult

  const embedded = asObject(asObject(fields.enrichment).verification)
  return Object.keys(embedded).length > 0 ? embedded : null
}

function readCitations(
  fields: JsonObject,
  aiDraft: JsonObject | null
): ResourceMapReviewCitation[] {
  const embeddedDraft = asObject(asObject(fields.enrichment).draft)
  return asArray(aiDraft?.citations ?? embeddedDraft.citations)
    .map((value) => {
      const citation = asObject(value)
      const sourceUrl = safeResourceMapExternalUrl(
        readString(citation.sourceUrl, citation.source_url)
      )
      if (!sourceUrl) return null
      return {
        claimPaths: asArray(citation.claimPaths ?? citation.claim_paths)
          .map((path) => readString(path))
          .filter((path): path is string => Boolean(path)),
        evidenceSnippet: readString(
          citation.evidenceSnippet,
          citation.evidence_snippet
        ),
        sourceUrl,
      }
    })
    .filter((value): value is ResourceMapReviewCitation => Boolean(value))
}

function fieldEvidenceFor(
  evidence: ResourceMapAdminFieldEvidenceRow[],
  paths: readonly string[]
) {
  return evidence.find(
    (item) =>
      item.evidence_type !== "ai_derived" &&
      paths.some(
        (path) =>
          item.field_path === path || item.field_path.endsWith(`.${path}`)
      )
  )
}

function uniqueStrings(values: unknown[]) {
  return [
    ...new Set(
      values
        .map((value) => readString(value))
        .filter((value): value is string => Boolean(value))
    ),
  ]
}

function readIssueStrings(value: unknown) {
  return asArray(value).map((issue) => {
    if (typeof issue === "string") return issue
    const object = asObject(issue)
    return readString(
      object.message,
      object.note,
      object.code,
      JSON.stringify(issue)
    )
  })
}

function readConflicts(verification: JsonObject | null) {
  if (!verification) return []
  return uniqueStrings([
    ...readIssueStrings(verification.contradictions),
    ...readIssueStrings(verification.unsupportedClaims),
    ...readIssueStrings(verification.unsupported_claims),
    ...readIssueStrings(verification.requiredCorrections),
    ...readIssueStrings(verification.required_corrections),
    ...asArray(verification.claimChecks)
      .map(asObject)
      .filter((check) => check.status && check.status !== "supported")
      .map((check) => readString(check.note, check.claimPath)),
  ])
}

function hasValue(value: unknown) {
  if (typeof value === "string") return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return value !== null && value !== undefined
}

export function buildResourceMapReviewSummary({
  record,
  evidence,
  enrichmentRuns,
}: {
  record: ResourceMapAdminImportRecordDetailRow
  evidence: ResourceMapAdminFieldEvidenceRow[]
  enrichmentRuns: ResourceMapAdminEnrichmentRunRow[]
}): ResourceMapReviewSummary {
  const fields = asObject(record.extracted_fields)
  const raw = asObject(record.raw_snapshot)
  const aiDraft = readAiDraft(fields, enrichmentRuns)
  const verification = readVerification(fields, enrichmentRuns)
  const citations = readCitations(fields, aiDraft)
  const comparisons = REVIEW_FIELDS.map(({ field, label, aliases }) => {
    const paths = [field, ...aliases]
    const fieldEvidence = fieldEvidenceFor(evidence, paths)
    return {
      field,
      label,
      sourceValue:
        fieldEvidence?.field_value ??
        readPath(raw, paths) ??
        "Not found in source",
      extractedValue:
        readPath(aiDraft ?? {}, paths) ??
        readPath(fields, paths) ??
        "Not extracted",
      confidence: fieldEvidence?.confidence_score ?? record.confidence_score,
      sourceUrl: safeResourceMapExternalUrl(
        fieldEvidence?.source_url ?? record.source_url
      ),
    }
  })
  const sourceComparisonCount = Number(
    readPath(fields, ["enrichment.sourceComparisonCount"]) ?? 0
  )
  const verificationStatus = readString(verification?.status)
  const conflicts = readConflicts(verification)
  const hasContact = hasValue(
    readPath(fields, [
      "phone",
      "email",
      "intakeUrl",
      "websiteUrl",
      "website_url",
    ])
  )
  const checks: ResourceMapReviewCheck[] = [
    {
      key: "title",
      label: "Specific Public Title",
      complete: hasValue(
        readPath(fields, ["serviceTitle", "title", "displayTitle"])
      ),
      detail: "Names the specific service, branch, or resource.",
    },
    {
      key: "summary",
      label: "Plain-Language Summary",
      complete: hasValue(
        readPath(fields, ["description", "publicSummary", "serviceDescription"])
      ),
      detail: "Explains what the public can receive.",
    },
    {
      key: "eligibility",
      label: "Eligibility",
      complete: hasValue(readPath(fields, ["eligibility"])),
      detail: "States eligibility or the source omission.",
    },
    {
      key: "access",
      label: "Access Instructions",
      complete: hasValue(
        readPath(fields, ["accessInstructions", "howToAccess"])
      ),
      detail: "Gives a clear next step.",
    },
    {
      key: "contact",
      label: "Actionable Contact",
      complete: hasContact,
      detail: "Includes a provider contact or intake link.",
    },
    {
      key: "location",
      label: "Location Or Service Area",
      complete: hasValue(readPath(fields, ["address", "serviceArea"])),
      detail: "Shows where service is available.",
    },
    {
      key: "citations",
      label: "Source Citations",
      complete: citations.length > 0,
      detail: "Connects public claims to authoritative URLs.",
    },
    {
      key: "passes",
      label: "2 Comparison Passes",
      complete: sourceComparisonCount >= 2,
      detail: `${sourceComparisonCount} completed comparison passes recorded.`,
    },
    {
      key: "verification",
      label: "Independent Verification",
      complete: verificationStatus === "approved" && conflicts.length === 0,
      detail: verificationStatus
        ? `Verification status: ${verificationStatus}.`
        : "No verification decision recorded.",
    },
  ]
  const blockers = uniqueStrings([
    ...readIssueStrings(record.quality_flags),
    ...record.reason_codes,
    ...conflicts,
    ...enrichmentRuns.flatMap((run) => [
      ...readIssueStrings(run.issues),
      run.error_message,
    ]),
    ...checks
      .filter((check) => !check.complete)
      .map((check) => `Missing: ${check.label}`),
  ])

  return {
    aiDraft,
    verification,
    citations,
    comparisons,
    checks,
    blockers,
    conflicts,
    readyForHumanApproval:
      checks.every((check) => check.complete) && blockers.length === 0,
  }
}

export {
  formatResourceMapReviewValue,
  safeResourceMapExternalUrl,
} from "./review-format"
