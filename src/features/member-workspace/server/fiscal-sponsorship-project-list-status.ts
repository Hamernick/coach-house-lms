import {
  analyzeFiscalSponsorshipActivityEligibility,
  type FiscalSponsorshipActivityEligibilityActivity,
  type FiscalSponsorshipApplicationStatus,
} from "@/features/fiscal-sponsorship"
import type {
  PlatformAdminDashboardLabFiscalSponsorshipStatus,
  PlatformAdminDashboardLabProject,
} from "@/features/platform-admin-dashboard"
import type { Database, Json } from "@/lib/supabase"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type ServerSupabase = Awaited<ReturnType<typeof createSupabaseServerClient>>
type ApplicationRow = Pick<
  Database["public"]["Tables"]["fiscal_sponsorship_applications"]["Row"],
  "project_id" | "status"
>
type OrganizationRow = Pick<
  Database["public"]["Tables"]["organizations"]["Row"],
  "user_id" | "ein" | "profile"
>
type ProgramRow = Pick<
  Database["public"]["Tables"]["programs"]["Row"],
  | "user_id"
  | "title"
  | "subtitle"
  | "description"
  | "location"
  | "location_type"
  | "address_city"
  | "address_state"
  | "address_country"
  | "features"
  | "goal_cents"
  | "wizard_snapshot"
>

function isMissingFiscalStatusSource(error: unknown) {
  if (!error || typeof error !== "object") return false
  const code = (error as { code?: string }).code
  return code === "42P01" || code === "42703" || code === "PGRST205"
}

function toRecord(value: Json | null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function toStringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function readProfileValue(profile: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = toStringValue(profile[key])
    if (value) return value
  }
  return null
}

function buildEligibilityActivity(
  program: ProgramRow
): FiscalSponsorshipActivityEligibilityActivity {
  const wizardSnapshot = toRecord(program.wizard_snapshot)
  const snapshotValue = (key: string) => readProfileValue(wizardSnapshot, key)

  return {
    title: program.title,
    subtitle: program.subtitle,
    description: program.description,
    location: program.location,
    locationType: program.location_type,
    addressCity: program.address_city,
    addressState: program.address_state,
    addressCountry: program.address_country,
    focusArea: snapshotValue("programType") ?? program.features?.[0] ?? null,
    objectKind: snapshotValue("objectKind"),
    estimatedBudgetCents: program.goal_cents,
    goalCents: program.goal_cents,
    wizardSnapshot,
  }
}

function resolveApplicationStatus(
  status: FiscalSponsorshipApplicationStatus
): PlatformAdminDashboardLabFiscalSponsorshipStatus {
  if (status === "countersigned") return "active"
  if (status === "declined") return "not_eligible"
  return "in_progress"
}

function resolveEligibilityStatus({
  organization,
  programs,
}: {
  organization: OrganizationRow | null
  programs: ProgramRow[]
}): PlatformAdminDashboardLabFiscalSponsorshipStatus {
  const profile = toRecord(organization?.profile ?? null)
  const organizationEligibility = {
    description: readProfileValue(profile, "description", "entity"),
    ein: organization?.ein ?? readProfileValue(profile, "ein"),
    mission: readProfileValue(profile, "mission"),
    need: readProfileValue(profile, "need"),
    address: readProfileValue(profile, "address"),
    addressStreet: readProfileValue(profile, "address_street", "addressStreet"),
    addressCity: readProfileValue(profile, "address_city", "addressCity"),
    addressState: readProfileValue(profile, "address_state", "addressState"),
    addressPostal: readProfileValue(profile, "address_postal", "addressPostal"),
    addressCountry: readProfileValue(
      profile,
      "address_country",
      "addressCountry"
    ),
  }

  const eligible = programs.some(
    (program) =>
      analyzeFiscalSponsorshipActivityEligibility({
        activity: buildEligibilityActivity(program),
        organization: organizationEligibility,
      }).eligible
  )

  return eligible ? "eligible" : "not_eligible"
}

export async function loadFiscalSponsorshipProjectListStatuses({
  projects,
  supabase,
}: {
  projects: PlatformAdminDashboardLabProject[]
  supabase: ServerSupabase
}) {
  const projectIds = projects.map((project) => project.id)
  const orgIds = Array.from(
    new Set(
      projects
        .map((project) => project.organizationId)
        .filter((value): value is string => Boolean(value))
    )
  )
  const statusByProjectId = new Map<
    string,
    PlatformAdminDashboardLabFiscalSponsorshipStatus
  >()

  if (projectIds.length === 0 || orgIds.length === 0) {
    return statusByProjectId
  }

  const [applicationsResult, organizationsResult, programsResult] =
    await Promise.all([
      supabase
        .from("fiscal_sponsorship_applications")
        .select("project_id, status")
        .in("project_id", projectIds)
        .returns<ApplicationRow[]>(),
      supabase
        .from("organizations")
        .select("user_id, ein, profile")
        .in("user_id", orgIds)
        .returns<OrganizationRow[]>(),
      supabase
        .from("programs")
        .select(
          "user_id, title, subtitle, description, location, location_type, address_city, address_state, address_country, features, goal_cents, wizard_snapshot"
        )
        .in("user_id", orgIds)
        .returns<ProgramRow[]>(),
    ])

  for (const result of [
    applicationsResult,
    organizationsResult,
    programsResult,
  ]) {
    if (!result.error) continue
    if (isMissingFiscalStatusSource(result.error)) return statusByProjectId
    throw supabaseErrorToError(
      result.error,
      "Unable to load fiscal sponsorship statuses."
    )
  }

  const applicationByProjectId = new Map(
    (applicationsResult.data ?? []).map((application) => [
      application.project_id,
      application,
    ])
  )
  const organizationById = new Map(
    (organizationsResult.data ?? []).map((organization) => [
      organization.user_id,
      organization,
    ])
  )
  const programsByOrgId = new Map<string, ProgramRow[]>()

  for (const program of programsResult.data ?? []) {
    const current = programsByOrgId.get(program.user_id) ?? []
    current.push(program)
    programsByOrgId.set(program.user_id, current)
  }

  for (const project of projects) {
    const application = applicationByProjectId.get(project.id)
    if (application) {
      statusByProjectId.set(
        project.id,
        resolveApplicationStatus(
          application.status as FiscalSponsorshipApplicationStatus
        )
      )
      continue
    }

    const orgId = project.organizationId
    if (!orgId) continue
    statusByProjectId.set(
      project.id,
      resolveEligibilityStatus({
        organization: organizationById.get(orgId) ?? null,
        programs: programsByOrgId.get(orgId) ?? [],
      })
    )
  }

  return statusByProjectId
}
