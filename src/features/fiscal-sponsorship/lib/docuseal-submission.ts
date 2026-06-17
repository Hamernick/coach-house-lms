type DocuSealSubmissionRecord = Record<string, unknown>

type ResolveDocuSealSubmitterSigningHrefInput = {
  apiBaseUrl?: string | null
  email?: string | null
  payload: unknown
  role?: string | null
}

function asRecord(value: unknown): DocuSealSubmissionRecord | null {
  return value && typeof value === "object"
    ? (value as DocuSealSubmissionRecord)
    : null
}

function getString(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim()
  if (typeof value === "number") return String(value)
  return null
}

function getNestedRecord(
  record: DocuSealSubmissionRecord | null,
  path: string[]
) {
  let next: unknown = record
  for (const key of path) {
    const nextRecord = asRecord(next)
    if (!nextRecord) return null
    next = nextRecord[key]
  }

  return asRecord(next)
}

function collectSubmitters(payload: unknown) {
  const root = asRecord(payload)
  const candidates = [
    root?.submitters,
    getNestedRecord(root, ["submission"])?.submitters,
    getNestedRecord(root, ["data"])?.submitters,
    getNestedRecord(root, ["data", "submission"])?.submitters,
  ]

  return candidates
    .filter(Array.isArray)
    .flatMap((candidate) => candidate as unknown[])
    .map(asRecord)
    .filter(Boolean) as DocuSealSubmissionRecord[]
}

function normalizeMatchValue(value?: string | null) {
  return value?.trim().toLowerCase() || null
}

function submitterMatches({
  email,
  role,
  submitter,
}: {
  email?: string | null
  role?: string | null
  submitter: DocuSealSubmissionRecord
}) {
  const expectedEmail = normalizeMatchValue(email)
  const expectedRole = normalizeMatchValue(role)
  const submitterEmail = normalizeMatchValue(getString(submitter.email))
  const submitterRole = normalizeMatchValue(
    getString(submitter.role) ?? getString(submitter.name)
  )

  if (expectedEmail && submitterEmail === expectedEmail) return true
  if (expectedRole && submitterRole?.includes(expectedRole)) return true
  return false
}

function getSubmitterUrl(submitter: DocuSealSubmissionRecord) {
  return (
    getString(submitter.url) ??
    getString(submitter.href) ??
    getString(submitter.src) ??
    getString(submitter.signing_url) ??
    getString(submitter.signingUrl) ??
    getString(submitter.submitter_url) ??
    getString(submitter.submitterUrl) ??
    getString(submitter.embed_src) ??
    getString(submitter.embedSrc)
  )
}

function normalizeExternalHref(href: string | null) {
  if (!href) return null

  try {
    const url = new URL(href)
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null
  } catch {
    return null
  }
}

function resolveDocuSealPublicBaseUrl(apiBaseUrl?: string | null) {
  const fallback = "https://docuseal.com"
  if (!apiBaseUrl) return fallback

  try {
    const url = new URL(apiBaseUrl)
    if (url.hostname === "api.docuseal.com") return fallback

    return `${url.protocol}//${url.host}`
  } catch {
    return fallback
  }
}

function buildSubmitterHrefFromSlug({
  apiBaseUrl,
  slug,
}: {
  apiBaseUrl?: string | null
  slug: string | null
}) {
  if (!slug) return null
  const directHref = normalizeExternalHref(slug)
  if (directHref) return directHref

  return `${resolveDocuSealPublicBaseUrl(apiBaseUrl)}/s/${encodeURIComponent(
    slug
  )}`
}

export function resolveDocuSealSubmitterSigningHref({
  apiBaseUrl,
  email,
  payload,
  role,
}: ResolveDocuSealSubmitterSigningHrefInput) {
  const submitters = collectSubmitters(payload)
  const submitter =
    submitters.find((candidate) =>
      submitterMatches({ email, role, submitter: candidate })
    ) ?? null

  if (!submitter) return null

  const directHref = normalizeExternalHref(getSubmitterUrl(submitter))
  if (directHref) return directHref

  return buildSubmitterHrefFromSlug({
    apiBaseUrl,
    slug: getString(submitter.slug),
  })
}
