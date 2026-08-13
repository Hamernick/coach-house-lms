"use server"

import { revalidatePath } from "next/cache"

import { resolveAuthenticatedAppContext } from "@/lib/auth/request-context"

import type { WorkspaceFinanceAccessLevel } from "../features/workspace-finance/types"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type WorkspaceFinanceAccessUpdateResult =
  | { accessLevel: WorkspaceFinanceAccessLevel | null; ok: true }
  | { error: string }

function revalidateFinanceRoutes() {
  revalidatePath("/workspace")
  revalidatePath("/my-organization")
  revalidatePath("/organization/workspace")
}

export async function updateWorkspaceFinanceAccess({
  accessLevel,
  memberId,
}: {
  accessLevel: WorkspaceFinanceAccessLevel | null
  memberId: string
}): Promise<WorkspaceFinanceAccessUpdateResult> {
  if (
    !UUID_PATTERN.test(memberId) ||
    (accessLevel !== null &&
      accessLevel !== "viewer" &&
      accessLevel !== "manager")
  ) {
    return { error: "Choose a valid board member and access level." }
  }

  let context: Awaited<ReturnType<typeof resolveAuthenticatedAppContext>>
  try {
    context = await resolveAuthenticatedAppContext()
  } catch {
    return { error: "You must be signed in to share Finance." }
  }

  const { activeOrg, supabase, user } = context
  if (activeOrg.role !== "owner" || activeOrg.orgId !== user.id) {
    return { error: "Only the organization owner can share Finance." }
  }

  const { data: boardMembership, error: membershipError } = await supabase
    .from("organization_memberships")
    .select("member_id")
    .eq("org_id", activeOrg.orgId)
    .eq("member_id", memberId)
    .eq("role", "board")
    .maybeSingle<{ member_id: string }>()

  if (membershipError || !boardMembership) {
    return { error: "Choose a current board member." }
  }

  const mutation = accessLevel
    ? await supabase.from("organization_finance_access").upsert(
        {
          access_level: accessLevel,
          granted_by: user.id,
          member_id: memberId,
          org_id: activeOrg.orgId,
        },
        { onConflict: "org_id,member_id" }
      )
    : await supabase
        .from("organization_finance_access")
        .delete()
        .eq("org_id", activeOrg.orgId)
        .eq("member_id", memberId)

  if (mutation.error) {
    return {
      error: accessLevel
        ? "Unable to update Finance access."
        : "Unable to revoke Finance access.",
    }
  }

  revalidateFinanceRoutes()
  return { accessLevel, ok: true }
}
