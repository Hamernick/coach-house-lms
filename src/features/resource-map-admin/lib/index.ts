import type {
  ResourceMapAdminCanonicalAction,
  ResourceMapAdminCanonicalEditInput,
  ResourceMapAdminCanonicalStateInput,
  ResourceMapAdminImportReviewInput,
  ResourceMapAdminImportReviewStatus,
  ResourceMapAdminMatchReviewInput,
  ResourceMapAdminMatchStatus,
  ResourceMapAdminPromotionInput,
  ResourceMapAdminVisibilityInput,
} from "../types"

const CANONICAL_ACTIONS = new Set<ResourceMapAdminCanonicalAction>([
  "approve",
  "hide",
  "suppress",
  "restore",
  "delete",
])

const IMPORT_REVIEW_STATUSES = new Set<ResourceMapAdminImportReviewStatus>([
  "needs_review",
  "approved",
  "rejected",
  "stale",
])

const MATCH_STATUSES = new Set<ResourceMapAdminMatchStatus>([
  "accepted",
  "rejected",
  "superseded",
])

function normalizeRequiredId(value: string, label: string) {
  const normalized = value.trim()
  if (!normalized) {
    throw new Error(`${label} is required.`)
  }
  return normalized
}

function normalizeOptionalId(value: string | null | undefined) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim()
  return normalized ? normalized.slice(0, 10_000) : null
}

function normalizeOptionalUrl(value: string | null | undefined) {
  const normalized = normalizeOptionalText(value)
  if (!normalized) return null

  try {
    return new URL(normalized).toString()
  } catch {
    throw new Error("Enter a valid URL.")
  }
}

function normalizeCanonicalEditableFields(
  input: ResourceMapAdminCanonicalEditInput
) {
  if (input.target === "organization") {
    const name = normalizeOptionalText(input.fields.name)
    if (!name) {
      throw new Error("Organization name is required.")
    }

    return {
      name,
      tagline: normalizeOptionalText(input.fields.tagline),
      description: normalizeOptionalText(input.fields.description),
      website_url: normalizeOptionalUrl(input.fields.website_url),
      donate_url: normalizeOptionalUrl(input.fields.donate_url),
    }
  }

  const title = normalizeOptionalText(input.fields.title)
  if (!title) {
    throw new Error("Service title is required.")
  }

  return {
    title,
    subtitle: normalizeOptionalText(input.fields.subtitle),
    description: normalizeOptionalText(input.fields.description),
    eligibility: normalizeOptionalText(input.fields.eligibility),
    cost: normalizeOptionalText(input.fields.cost),
    who_it_helps: normalizeOptionalText(input.fields.who_it_helps),
    intake_url: normalizeOptionalUrl(input.fields.intake_url),
  }
}

export function normalizeResourceMapAdminReason(
  value: string | null | undefined
) {
  const normalized = value?.trim()
  return normalized ? normalized.slice(0, 1000) : null
}

export function normalizeCanonicalStateInput(
  input: ResourceMapAdminCanonicalStateInput
): ResourceMapAdminCanonicalStateInput {
  if (input.target !== "organization" && input.target !== "service") {
    throw new Error("Choose an organization or service target.")
  }

  if (!CANONICAL_ACTIONS.has(input.action)) {
    throw new Error("Choose a valid resource curation action.")
  }

  return {
    target: input.target,
    id: normalizeRequiredId(input.id, "Resource id"),
    action: input.action,
    reason: normalizeResourceMapAdminReason(input.reason),
  }
}

export function normalizeCanonicalEditInput(
  input: ResourceMapAdminCanonicalEditInput
): ResourceMapAdminCanonicalEditInput {
  if (input.target !== "organization" && input.target !== "service") {
    throw new Error("Choose an organization or service target.")
  }

  return {
    target: input.target,
    id: normalizeRequiredId(input.id, "Resource id"),
    fields: normalizeCanonicalEditableFields(input),
    reason: normalizeResourceMapAdminReason(input.reason),
  }
}

export function normalizeImportReviewInput(
  input: ResourceMapAdminImportReviewInput
): ResourceMapAdminImportReviewInput {
  if (!IMPORT_REVIEW_STATUSES.has(input.status)) {
    throw new Error("Choose a valid import review status.")
  }

  return {
    importRecordId: normalizeRequiredId(
      input.importRecordId,
      "Import record id"
    ),
    status: input.status,
    reason: normalizeResourceMapAdminReason(input.reason),
  }
}

export function normalizeVisibilityInput(
  input: ResourceMapAdminVisibilityInput
): ResourceMapAdminVisibilityInput {
  if (input.kind !== "contact" && input.kind !== "link") {
    throw new Error("Choose a contact or link target.")
  }

  return {
    id: normalizeRequiredId(input.id, "Visibility target id"),
    kind: input.kind,
    isPublic: Boolean(input.isPublic),
    reason: normalizeResourceMapAdminReason(input.reason),
  }
}

export function normalizeMatchReviewInput(
  input: ResourceMapAdminMatchReviewInput
): ResourceMapAdminMatchReviewInput {
  if (!MATCH_STATUSES.has(input.status)) {
    throw new Error("Choose a valid match review status.")
  }

  return {
    matchId: normalizeRequiredId(input.matchId, "Match id"),
    status: input.status,
    reason: normalizeResourceMapAdminReason(input.reason),
  }
}

export function normalizePromotionInput(
  input: ResourceMapAdminPromotionInput
): ResourceMapAdminPromotionInput {
  const promotedOrganizationId = normalizeOptionalId(
    input.promotedOrganizationId
  )
  const promotedServiceId = normalizeOptionalId(input.promotedServiceId)

  if (!promotedOrganizationId && !promotedServiceId) {
    throw new Error("Choose a promoted organization or service target.")
  }

  return {
    importRecordId: normalizeRequiredId(
      input.importRecordId,
      "Import record id"
    ),
    promotedOrganizationId,
    promotedServiceId,
    reason: normalizeResourceMapAdminReason(input.reason),
  }
}
