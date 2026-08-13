import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase"

import type {
  WorkspaceFinanceAccessInput,
  WorkspaceFinanceAccessLevel,
} from "../types"

type BoardMembershipRow = {
  member_email: string
  member_id: string
}

type FinanceAccessRow = {
  access_level: WorkspaceFinanceAccessLevel
  member_id: string
}

export async function loadOrganizationFinanceAccess({
  canManage,
  orgId,
  supabase,
}: {
  canManage: boolean
  orgId: string
  supabase: SupabaseClient<Database>
}): Promise<WorkspaceFinanceAccessInput> {
  if (!canManage) return { canManage: false, members: [], state: "ready" }

  const [membershipsResult, accessResult] = await Promise.all([
    supabase
      .from("organization_memberships")
      .select("member_id,member_email")
      .eq("org_id", orgId)
      .eq("role", "board")
      .order("member_email", { ascending: true })
      .limit(50)
      .returns<BoardMembershipRow[]>(),
    supabase
      .from("organization_finance_access")
      .select("member_id,access_level")
      .eq("org_id", orgId)
      .limit(50)
      .returns<FinanceAccessRow[]>(),
  ])

  if (membershipsResult.error || accessResult.error) {
    return { canManage: true, members: [], state: "error" }
  }

  const accessByMemberId = new Map(
    (accessResult.data ?? []).map((access) => [
      access.member_id,
      access.access_level,
    ])
  )

  return {
    canManage: true,
    members: (membershipsResult.data ?? []).map((membership) => ({
      accessLevel: accessByMemberId.get(membership.member_id) ?? null,
      email: membership.member_email,
      memberId: membership.member_id,
    })),
    state: "ready",
  }
}
