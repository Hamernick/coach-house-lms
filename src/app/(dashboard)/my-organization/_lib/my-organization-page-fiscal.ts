import { loadFiscalSponsorshipProjectWorkflowSummary } from "@/features/fiscal-sponsorship"
import { resolveOptionalAuthenticatedAppContext } from "@/lib/auth/request-context"

type MyOrganizationSupabase = NonNullable<
  Awaited<ReturnType<typeof resolveOptionalAuthenticatedAppContext>>
>["supabase"]

export function resolveFiscalApplicantPrefillIdentity({
  profileAudience,
  user,
}: {
  profileAudience: { fullName: string | null }
  user: { email?: string | null }
}) {
  return {
    applicantEmail: user.email ?? null,
    applicantFullName: profileAudience.fullName,
  }
}

export async function loadMyOrganizationFiscalSponsorshipWorkflow({
  orgId,
  supabase,
}: {
  orgId: string
  supabase: MyOrganizationSupabase
}) {
  const { data: fiscalSponsorshipProjectRow } = await supabase
    .from("organization_projects")
    .select("id")
    .eq("org_id", orgId)
    .eq("project_kind", "organization_admin")
    .maybeSingle<{ id: string }>()
  const fiscalSponsorshipProjectId = fiscalSponsorshipProjectRow?.id ?? null
  const fiscalSponsorshipWorkflowSummaryResult = fiscalSponsorshipProjectId
    ? await loadFiscalSponsorshipProjectWorkflowSummary(
        fiscalSponsorshipProjectId
      )
    : null
  const fiscalSponsorshipWorkflowSummary =
    fiscalSponsorshipWorkflowSummaryResult &&
    !("error" in fiscalSponsorshipWorkflowSummaryResult)
      ? fiscalSponsorshipWorkflowSummaryResult
      : null

  return {
    fiscalSponsorshipProjectId,
    fiscalSponsorshipWorkflowSummary,
  }
}
