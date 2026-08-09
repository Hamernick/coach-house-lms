"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { resolveAuthenticatedAppContext } from "@/lib/auth/request-context"
import type {
  AssignAllOrganizationCoachesResult,
  SetOrganizationCoachScopeResult,
  UpdateOrganizationCoachAssignmentInput,
  UpdateOrganizationCoachAssignmentResult,
} from "../types"

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  coachUserIds: z.array(z.string().uuid()).max(100),
})

function isMissingAssignmentMigration(error: { code?: string | null }) {
  return (
    error.code === "42P01" ||
    error.code === "42883" ||
    error.code === "PGRST202" ||
    error.code === "PGRST205"
  )
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort()
}

export async function updateOrganizationCoachAssignmentAction(
  input: UpdateOrganizationCoachAssignmentInput
): Promise<UpdateOrganizationCoachAssignmentResult> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success)
    return { error: "Select a valid organization and coach." }

  const { profileAudience, supabase } = await resolveAuthenticatedAppContext()
  if (profileAudience.platformAccessLevel !== "developer") {
    return { error: "Only developers can change coach assignments." }
  }

  const coachUserIds = uniqueSorted(parsed.data.coachUserIds)
  const { error } = await supabase.rpc("set_organization_coach_assignments", {
    p_organization_id: parsed.data.organizationId,
    p_coach_user_ids: coachUserIds,
  })

  if (error) {
    if (isMissingAssignmentMigration(error)) {
      return { error: "Assignments need the latest database migration." }
    }
    if (error.code === "23503") {
      return { error: "Select valid coach-level staff members." }
    }
    if (error.code === "23514" || error.code === "42501") {
      return { error: error.message }
    }
    console.error("Unable to update organization coach assignment.", error)
    return { error: "Unable to update the coach assignment." }
  }

  revalidatePath("/organizations", "layout")
  return {
    ok: true,
    organizationId: parsed.data.organizationId,
    coachUserIds,
  }
}

function toAssignAllResult(
  data: unknown
): AssignAllOrganizationCoachesResult | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null
  const value = data as Record<string, unknown>
  if (
    typeof value.organizationCount !== "number" ||
    typeof value.coachCount !== "number" ||
    typeof value.assignmentCount !== "number" ||
    typeof value.addedCount !== "number"
  ) {
    return null
  }
  return {
    ok: true,
    organizationCount: value.organizationCount,
    coachCount: value.coachCount,
    assignmentCount: value.assignmentCount,
    addedCount: value.addedCount,
  }
}

export async function assignAllOrganizationCoachesAction(): Promise<AssignAllOrganizationCoachesResult> {
  const { profileAudience, supabase } = await resolveAuthenticatedAppContext()
  if (profileAudience.platformAccessLevel !== "developer") {
    return { error: "Only developers can change coach assignments." }
  }

  const { data, error } = await supabase.rpc(
    "assign_all_coaches_to_all_organizations"
  )
  if (error) {
    if (isMissingAssignmentMigration(error)) {
      return { error: "Bulk assignment needs the latest database migration." }
    }
    if (error.code === "23514" || error.code === "42501") {
      return { error: error.message }
    }
    console.error("Unable to assign every coach to every organization.", error)
    return { error: "Unable to complete bulk coach assignment." }
  }

  const result = toAssignAllResult(data)
  if (!result) return { error: "Bulk assignment returned an invalid result." }

  revalidatePath("/organizations", "layout")
  return result
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
