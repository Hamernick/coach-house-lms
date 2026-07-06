export function normalizeString(value) {
  return typeof value === "string" ? value.trim() : ""
}

export function normalizeName(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function normalizeEmail(value) {
  return normalizeString(value).toLowerCase() || null
}

export function normalizePhone(value) {
  const digits = normalizeString(value).replace(/\D/g, "")
  if (!digits) return null
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1)
  return digits
}

export function normalizeDomain(value) {
  const raw = normalizeString(value)
  if (!raw) return null

  try {
    const url = raw.includes("://") ? new URL(raw) : new URL(`https://${raw}`)
    return url.hostname.toLowerCase().replace(/^www\./, "")
  } catch {
    return raw
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .trim()
  }
}

export function normalizeAddress(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s#.-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function getFirstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return null
}

export function resolveExtractedFields(record) {
  const fields =
    record.extractedFields ?? record.extracted_fields ?? record.fields ?? record
  return fields && typeof fields === "object" && !Array.isArray(fields)
    ? fields
    : {}
}

export function buildNormalizedImportFields(record) {
  const fields = resolveExtractedFields(record)
  const website = getFirstString(
    fields.websiteUrl,
    fields.website_url,
    fields.website,
    record.sourceUrl,
    record.source_url
  )
  const address = getFirstString(
    fields.address,
    fields.fullAddress,
    fields.address_line1,
    fields.streetAddress
  )
  const name = getFirstString(
    fields.organizationName,
    fields.organization_name,
    fields.name,
    fields.title,
    record.title
  )
  const phone = getFirstString(
    fields.phone,
    fields.phoneNumber,
    fields.telephone
  )
  const email = getFirstString(fields.email, fields.contactEmail)

  const normalizedName = normalizeName(record.normalizedName ?? name)
  const normalizedDomain = normalizeDomain(record.normalizedDomain ?? website)
  const normalizedPhone = normalizePhone(record.normalizedPhone ?? phone)
  const normalizedEmail = normalizeEmail(record.normalizedEmail ?? email)
  const normalizedAddress = normalizeAddress(
    record.normalizedAddress ?? address
  )
  const normalizedFingerprint = [
    normalizedName,
    normalizedDomain,
    normalizedPhone,
    normalizedEmail,
    normalizedAddress,
  ]
    .filter(Boolean)
    .join("|")

  return {
    normalized_name: normalizedName || null,
    normalized_domain: normalizedDomain || null,
    normalized_phone: normalizedPhone,
    normalized_email: normalizedEmail,
    normalized_address: normalizedAddress || null,
    normalized_fingerprint: normalizedFingerprint || null,
  }
}
