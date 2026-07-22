"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { resolveAuthenticatedAppContext } from "@/lib/auth/request-context"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import type {
  SetOrganizationCoachScopeResult,
  UpdateOrganizationCoachAssignmentInput,
  UpdateOrganizationCoachAssignmentResult,
} from "../types"
import { loadOrganizationCoachScopeStatus } from "./loaders"

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  coachUserId: z.string().uuid().nullable(),
})

function isMissingAssignmentsTable(error: { code?: string | null }) {
  return error.code === "42P01" || error.code === "PGRST205"
}

export async function updateOrganizationCoachAssignmentAction(
  input: UpdateOrganizationCoachAssignmentInput
): Promise<UpdateOrganizationCoachAssignmentResult> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success)
    return { error: "Select a valid organization and coach." }

  const { user, profileAudience } = await resolveAuthenticatedAppContext()
  if (profileAudience.platformAccessLevel !== "developer") {
    return { error: "Only developers can change coach assignments." }
  }

  const admin = createSupabaseAdminClient()
  const { data: organization } = await admin
    .from("organizations")
    .select("user_id")
    .eq("user_id", parsed.data.organizationId)
    .maybeSingle()
  if (!organization) return { error: "Organization not found." }

  let error = null
  if (parsed.data.coachUserId) {
    const { data: coach } = await admin
      .from("platform_staff_members")
      .select("user_id")
      .eq("user_id", parsed.data.coachUserId)
      .eq("access_level", "coach")
      .maybeSingle()
    if (!coach) return { error: "Select a coach-level staff member." }

    const result = await admin.from("organization_coach_assignments").upsert(
      {
        organization_id: parsed.data.organizationId,
        coach_user_id: parsed.data.coachUserId,
        assigned_by: user.id,
      },
      { onConflict: "organization_id" }
    )
    error = result.error
  } else {
    const scopeStatus = await loadOrganizationCoachScopeStatus({
      supabase: admin,
    })
    if (scopeStatus.assignedOnlyEnabled) {
      return {
        error:
          "Reassign this organization or disable assigned-only coach visibility before unassigning it.",
      }
    }
    const result = await admin
      .from("organization_coach_assignments")
      .delete()
      .eq("organization_id", parsed.data.organizationId)
    error = result.error
  }

  if (error) {
    if (isMissingAssignmentsTable(error)) {
      return { error: "Assignments need the latest database migration." }
    }
    console.error("Unable to update organization coach assignment.", error)
    return { error: "Unable to update the coach assignment." }
  }

  revalidatePath("/organizations", "layout")
  return {
    ok: true,
    organizationId: parsed.data.organizationId,
    coachUserId: parsed.data.coachUserId,
  }
}

const scopeInputSchema = z.boolean()

function toScopeResult(data: unknown): SetOrganizationCoachScopeResult | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null
  const value = data as Record<string, unknown>
  if (
    typeof value.assignedOnlyEnabled !== "boolean" ||
    typeof value.organizationCount !== "number" ||
    typeof value.assignmentCount !== "number" ||
    typeof value.unassignedCount !== "number"
  ) {
    return null
  }

  return {
    ok: true,
    assignedOnlyEnabled: value.assignedOnlyEnabled,
    organizationCount: value.organizationCount,
    assignmentCount: value.assignmentCount,
    unassignedCount: value.unassignedCount,
  }
}

export async function setOrganizationCoachScopeEnabledAction(
  enabled: boolean
): Promise<SetOrganizationCoachScopeResult> {
  const parsed = scopeInputSchema.safeParse(enabled)
  if (!parsed.success) return { error: "Choose a valid coach visibility." }

  const { supabase, profileAudience } = await resolveAuthenticatedAppContext()
  if (profileAudience.platformAccessLevel !== "developer") {
    return { error: "Only developers can change coach visibility." }
  }

  const { data, error } = await supabase.rpc(
    "set_organization_coach_scope_enabled",
    { p_enabled: parsed.data }
  )

  if (error) {
    if (error.code === "23514" || error.code === "42501") {
      return { error: error.message }
    }
    console.error("Unable to update coach visibility.", error)
    return { error: "Unable to update coach visibility." }
  }

  const result = toScopeResult(data)
  if (!result) return { error: "Coach visibility returned an invalid result." }

  revalidatePath("/organizations", "layout")
  return result
}
