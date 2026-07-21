import { revalidatePath } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"

import { resolveAuthenticatedAppContext } from "@/lib/auth/request-context"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { canEditOrganization } from "@/lib/organization/active-org"
import type { Database } from "@/lib/supabase"
import type {
  FiscalSponsorshipApplicationRecord,
  FiscalSponsorshipApplicationStatus,
  FiscalSponsorshipLegalEntityType,
  FiscalSponsorshipProjectDurationType,
} from "../types"

export type FiscalApplicationRow =
  Database["public"]["Tables"]["fiscal_sponsorship_applications"]["Row"]
type FiscalApplicationUpdate =
  Database["public"]["Tables"]["fiscal_sponsorship_applications"]["Update"]
export type FiscalDocumentRow =
  Database["public"]["Tables"]["fiscal_sponsorship_documents"]["Row"]
type FiscalWorkflowClient = SupabaseClient<Database, "public">
type FiscalProjectRow = {
  id: string
  org_id: string
}
type FiscalWorkflowError = { error: string }
type FiscalWorkflowContext = Awaited<
  ReturnType<typeof resolveAuthenticatedAppContext>
> & {
  project: FiscalProjectRow
}
type LoadFiscalApplicationForProjectResult =
  | { application: FiscalApplicationRow }
  | FiscalWorkflowError
type LoadLatestAgreementDocumentResult =
  | { document: FiscalDocumentRow }
  | FiscalWorkflowError
type UpdateFiscalApplicationStatusResult = { ok: true } | FiscalWorkflowError
type ResolveFiscalProjectResult =
  | { ok: true; project: FiscalProjectRow }
  | { ok: false; error: string }

export function isMissingFiscalWorkflowTableError(error: unknown) {
  if (!error || typeof error !== "object") return false
  const record = error as Record<string, unknown>
  if (record.code === "42P01" || record.code === "PGRST205") return true

  const message =
    typeof record.message === "string"
      ? record.message
      : typeof record.details === "string"
        ? record.details
        : ""

  return [
    "fiscal_sponsorship_applications",
    "fiscal_sponsorship_reviews",
    "fiscal_sponsorship_documents",
    "fiscal_sponsorship_signature_packets",
    "fiscal_sponsorship_events",
  ].some((table) => message.includes(table))
}

export function buildWorkflowTableError(): FiscalWorkflowError {
  return {
    error:
      "Fiscal sponsorship workflow is not available until the latest database migrations are applied.",
  }
}

async function resolveFiscalProject({
  projectId,
  supabase,
}: {
  projectId: string
  supabase: Pick<FiscalWorkflowClient, "from">
}): Promise<ResolveFiscalProjectResult> {
  const { data, error } = await supabase
    .from("organization_projects")
    .select("id, org_id")
    .eq("id", projectId)
    .maybeSingle<FiscalProjectRow>()

  if (error || !data) {
    return { ok: false, error: "Unable to find that organization project." }
  }

  return { ok: true, project: data }
}

export function canCoachManageFiscalSponsorship(isAdmin: boolean) {
  return isAdmin
}

export function canEditFiscalProject({
  activeOrgRole,
  activeOrgId,
  isAdmin,
  project,
}: {
  activeOrgRole: Parameters<typeof canEditOrganization>[0]
  activeOrgId: string
  isAdmin: boolean
  project: FiscalProjectRow
}) {
  return (
    isAdmin ||
    (project.org_id === activeOrgId && canEditOrganization(activeOrgRole))
  )
}

export function mapFiscalApplicationRow(
  row: FiscalApplicationRow
): FiscalSponsorshipApplicationRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    projectId: row.project_id,
    status: row.status as FiscalSponsorshipApplicationStatus,
    applicantFullName: row.applicant_full_name,
    applicantFirstName: row.applicant_first_name,
    applicantLastName: row.applicant_last_name,
    mailingStreetAddress: row.mailing_street_address,
    mailingStreetAddress2: row.mailing_street_address_2,
    mailingCity: row.mailing_city,
    mailingState: row.mailing_state,
    mailingPostalCode: row.mailing_postal_code,
    phoneNumber: row.phone_number,
    primaryEmail: row.primary_email,
    legalEntityType:
      row.legal_entity_type as FiscalSponsorshipLegalEntityType | null,
    legalEntityHas501c3: row.legal_entity_has_501c3,
    formationStatus: row.formation_status,
    projectName: row.project_name,
    projectDurationType:
      row.project_duration_type as FiscalSponsorshipProjectDurationType | null,
    temporaryStartDate: row.temporary_start_date,
    temporaryEndDate: row.temporary_end_date,
    focusArea: row.focus_area,
    projectDescription: row.project_description,
    projectLocation: row.project_location,
    estimatedBudgetCents: row.estimated_budget_cents,
    expenseSummary: row.expense_summary,
    prospectiveFundingSources: row.prospective_funding_sources,
    publicBenefit: row.public_benefit,
    leadershipBackground: row.leadership_background,
    initiativeHistory: row.initiative_history,
    shortPublicDescription: row.short_public_description,
    operatesOutsideUnitedStates: row.operates_outside_united_states,
    receivesInvestorReturnFunds: row.receives_investor_return_funds,
    engagesInLobbying: row.engages_in_lobbying,
    hasLegalComplianceFinancialConcerns:
      row.has_legal_compliance_financial_concerns,
    concernsExplanation: row.concerns_explanation,
    sourceSnapshot: row.source_snapshot,
    documentTemplatePayload: row.document_template_payload,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function revalidateFiscalApplicationRoutes(projectId: string) {
  revalidatePath("/organizations")
  revalidatePath(`/organizations/${projectId}`)
  revalidatePath("/workspace")
  revalidatePath("/my-organization")
  revalidatePath("/organization/workspace")
}

export function getApplicationOrganizationName(
  application: FiscalApplicationRow
) {
  const payload = application.document_template_payload
  if (payload && typeof payload === "object" && "agreement" in payload) {
    const agreement = (payload as { agreement?: unknown }).agreement
    if (
      agreement &&
      typeof agreement === "object" &&
      "organizationName" in agreement
    ) {
      const name = (agreement as { organizationName?: unknown })
        .organizationName
      if (typeof name === "string" && name.trim()) return name.trim()
    }
  }

  const snapshot = application.source_snapshot
  if (snapshot && typeof snapshot === "object" && "organization" in snapshot) {
    const organization = (snapshot as { organization?: unknown }).organization
    if (
      organization &&
      typeof organization === "object" &&
      "name" in organization
    ) {
      const name = (organization as { name?: unknown }).name
      if (typeof name === "string" && name.trim()) return name.trim()
    }
  }

  return "Coach House"
}

export function sanitizeAgreementFilename(filename: string) {
  const cleaned = filename.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-")
  return cleaned.replace(/(^-|-$)/g, "") || "fiscal-sponsorship-agreement.html"
}

export async function insertFiscalEvent({
  applicationId,
  eventType,
  metadata,
  orgId,
  projectId,
  summary,
  supabase,
  userId,
}: {
  applicationId: string | null
  eventType: string
  metadata?: unknown
  orgId: string
  projectId: string
  summary: string
  supabase: Pick<FiscalWorkflowClient, "from">
  userId: string
}) {
  await supabase.from("fiscal_sponsorship_events").insert({
    actor_id: userId,
    application_id: applicationId,
    event_type: eventType,
    metadata: metadata ?? {},
    org_id: orgId,
    project_id: projectId,
    summary,
  })
}

export async function loadFiscalApplicationForProject({
  project,
  supabase,
}: {
  project: FiscalProjectRow
  supabase: Pick<FiscalWorkflowClient, "from">
}): Promise<LoadFiscalApplicationForProjectResult> {
  const { data, error } = await supabase
    .from("fiscal_sponsorship_applications")
    .select("*")
    .eq("project_id", project.id)
    .eq("org_id", project.org_id)
    .maybeSingle<FiscalApplicationRow>()

  if (error) {
    return isMissingFiscalWorkflowTableError(error)
      ? buildWorkflowTableError()
      : { error: "Unable to load fiscal sponsorship application." }
  }

  if (!data) {
    return {
      error: "Save the fiscal sponsorship application before continuing.",
    }
  }

  return { application: data }
}

export async function updateFiscalApplicationStatus({
  applicationId,
  patch,
  supabase,
}: {
  applicationId: string
  patch: FiscalApplicationUpdate
  supabase: Pick<FiscalWorkflowClient, "from">
}): Promise<UpdateFiscalApplicationStatusResult> {
  const { error } = await supabase
    .from("fiscal_sponsorship_applications")
    .update(patch)
    .eq("id", applicationId)

  if (error) {
    return isMissingFiscalWorkflowTableError(error)
      ? buildWorkflowTableError()
      : { error: "Unable to update fiscal sponsorship application." }
  }

  return { ok: true }
}

export async function loadLatestAgreementDocument({
  applicationId,
  documentId,
  supabase,
}: {
  applicationId: string
  documentId?: string | null
  supabase: Pick<FiscalWorkflowClient, "from">
}): Promise<LoadLatestAgreementDocumentResult> {
  let query = supabase
    .from("fiscal_sponsorship_documents")
    .select("*")
    .eq("application_id", applicationId)
    .eq("kind", "agreement")

  if (documentId) {
    query = query.eq("id", documentId)
  } else {
    query = query.order("version", { ascending: false }).limit(1)
  }

  const { data, error } = await query.maybeSingle<FiscalDocumentRow>()

  if (error) {
    return isMissingFiscalWorkflowTableError(error)
      ? buildWorkflowTableError()
      : { error: "Unable to load the generated agreement." }
  }

  if (!data) {
    return {
      error: "Generate the fiscal sponsorship agreement before sending.",
    }
  }

  return { document: data }
}

export async function resolveProjectAndContext(
  projectId: string
): Promise<FiscalWorkflowContext | FiscalWorkflowError> {
  const trimmedProjectId = projectId.trim()
  if (!trimmedProjectId) return { error: "Choose a project before continuing." }

  const context = await resolveAuthenticatedAppContext()
  const supabase =
    context.profileAudience.isPlatformStaff || context.profileAudience.isAdmin
      ? createSupabaseAdminClient()
      : context.supabase
  const projectResult = await resolveFiscalProject({
    projectId: trimmedProjectId,
    supabase,
  })
  if (!projectResult.ok) return { error: projectResult.error }

  return {
    ...context,
    supabase,
    project: projectResult.project,
  }
}
