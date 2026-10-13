const text = (v) =>
  String(v ?? "")
    .trim()
    .replace(/\s+/g, " ")
export function normalizeAuditAddress(value) {
  if (!value || typeof value !== "object") return null
  return {
    street: text(value.street ?? value.AddressLine1Txt),
    line2: text(value.line2 ?? value.AddressLine2Txt),
    city: text(value.city ?? value.CityNm),
    state: text(value.state ?? value.StateAbbreviationCd).toUpperCase(),
    postalCode: text(value.postalCode ?? value.ZIPCd),
  }
}

// A geocoding candidate is not a publishable pin or a verified physical service site.
export function assessAuditAddress(value, identity) {
  const address = normalizeAuditAddress(value)
  const combined = `${address?.street ?? ""} ${address?.line2 ?? ""}`
  let reason = "needs_geocoding_and_location_review"
  if (
    value?.confidential ||
    identity.confidential ||
    value?.kind === "confidential"
  )
    reason = "confidential_address"
  else if (
    value?.isPoBox ||
    /\b(?:P\s*\.?\s*O\s*\.?\s*(?:BOX|B\b)|POST\s+OFFICE\s+BOX|PMB|PRIVATE\s+MAIL\s*BOX|GENERAL\s+DELIVERY)\b/i.test(
      combined
    )
  )
    reason = "mailbox_or_mail_drop"
  else if (
    identity.inCareOf ||
    /(?:\bC\s*\/\s*O\b|\bCARE\s+OF\b|\b(?:CPA|ACCOUNTING|REGISTERED AGENT)\b)/i.test(
      combined
    )
  )
    reason = "care_of_or_agent_review"
  else if (
    !address?.street ||
    !address.city ||
    !address.state ||
    !address.postalCode
  )
    reason = "incomplete_address"
  else if (
    !/^(?:AL|AK|AZ|AR|CA|CO|CT|DE|DC|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|PR)$/.test(
      address.state
    )
  )
    reason = "outside_initial_geocoder_coverage"
  else if (
    !/^\d{5}(?:-?\d{4})?$/.test(address.postalCode) ||
    !/\d/.test(address.street)
  )
    reason = "address_format_review"
  return {
    role: "filing",
    address,
    geocodeCandidate: reason === "needs_geocoding_and_location_review",
    pinEligible: false,
    reason,
    requiresResidentialConfidentialityReview: true,
  }
}
