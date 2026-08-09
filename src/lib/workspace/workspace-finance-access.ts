import type { AuthenticatedAppRequestContext } from "@/lib/auth/request-context"

type WorkspaceFinanceAccessInput = {
  activeOrg: AuthenticatedAppRequestContext["activeOrg"]
  supabase: AuthenticatedAppRequestContext["supabase"]
  userId: string
}

export async function canViewWorkspaceFinance({
  activeOrg,
  supabase,
  userId,
}: WorkspaceFinanceAccessInput) {
  if (activeOrg.role === "owner") return true

  const { data } = await supabase
    .from("organization_finance_access")
    .select("access_level")
    .eq("org_id", activeOrg.orgId)
    .eq("member_id", userId)
    .maybeSingle<{ access_level: string }>()

  return data?.access_level === "viewer" || data?.access_level === "manager"
}

export async function canManageWorkspaceFinance(
  input: WorkspaceFinanceAccessInput
) {
  if (input.activeOrg.role === "owner") return true

  const { data } = await input.supabase
    .from("organization_finance_access")
    .select("access_level")
    .eq("org_id", input.activeOrg.orgId)
    .eq("member_id", input.userId)
    .eq("access_level", "manager")
    .maybeSingle<{ access_level: string }>()

  return data?.access_level === "manager"
}
