import type { FiscalApplicationRow } from "./workflow-support"

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

export function validateApplicationForSubmission(
  application: FiscalApplicationRow
) {
  const missingFields: string[] = []

  if (
    !hasText(application.applicant_full_name) &&
    (!hasText(application.applicant_first_name) ||
      !hasText(application.applicant_last_name))
  ) {
    missingFields.push("applicant name")
  }

  if (!hasText(application.primary_email)) missingFields.push("primary email")
  if (!hasText(application.mailing_street_address)) {
    missingFields.push("U.S. mailing address")
  }
  if (!hasText(application.mailing_city)) missingFields.push("mailing city")
  if (!hasText(application.mailing_state)) missingFields.push("mailing state")
  if (!hasText(application.mailing_postal_code)) {
    missingFields.push("mailing postal code")
  }
  if (!hasText(application.legal_entity_type)) {
    missingFields.push("legal entity type")
  }
  if (
    application.legal_entity_type &&
    application.legal_entity_type !== "individual" &&
    !hasText(application.formation_status)
  ) {
    missingFields.push("formation status")
  }
  if (!hasText(application.project_name)) missingFields.push("project name")
  if (!hasText(application.project_description)) {
    missingFields.push("project description")
  }
  if (!hasText(application.public_benefit)) missingFields.push("public benefit")
  if (!hasText(application.project_duration_type)) {
    missingFields.push("project duration")
  }
  if (
    application.estimated_budget_cents === null ||
    application.estimated_budget_cents <= 0
  ) {
    missingFields.push("estimated budget")
  }
  if (!hasText(application.prospective_funding_sources)) {
    missingFields.push("funding sources")
  }

  if (missingFields.length > 0) {
    return `Complete these fiscal application fields before submitting: ${missingFields.join(", ")}.`
  }

  if (application.operates_outside_united_states !== false) {
    return "Coach House can only review U.S.-based projects right now. Confirm U.S. operations before submitting."
  }

  if (application.receives_investor_return_funds !== false) {
    return "Coach House cannot sponsor projects that receive investor-return funds. Update the eligibility attestation before submitting."
  }

  return null
}
